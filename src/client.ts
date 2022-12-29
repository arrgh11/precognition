import { AxiosError, AxiosInstance, AxiosResponse, default as Axios } from 'axios'
import { Validator } from './validator'
import { Config, Client, RequestFingerprintResolver, StatusHandler, ClientCallback } from './types'

/**
 * The configured axios client.
 */
let axiosClient: AxiosInstance = Axios

/**
 * The request fingerprint resolver.
 */
let requestFingerprintResolver: RequestFingerprintResolver = (config, axios) => `${config.method}:${config.baseURL ?? axios.defaults.baseURL ?? ''}${config.url}`

/**
 * Should nested keys also have their parent keys validated.
 *
 * `members.0.name` would resolve to `members,members.0,members.0.name`.
 */
let autoValidateParentKeys = false

/**
 * The abort controller cache.
 */
const abortControllers: { [key: string]: AbortController } = {}

/**
 * The precognitive HTTP client instance.
 */
export const client: Client = {
    axios: () => axiosClient,
    get: (url, config = {}) => request({ ...config, url, method: 'get' }),
    post: (url, data = {}, config = {}) => request({ ...config, url, data, method: 'post' }),
    patch: (url, data = {}, config = {}) => request({ ...config, url, data, method: 'patch' }),
    put: (url, data = {}, config = {}) => request({ ...config, url, data, method: 'put' }),
    delete: (url, config = {}) => request({ ...config, url, method: 'delete' }),
    validate(callback: ClientCallback) {
        return Validator(this, callback)
    },
    use(client) {
        axiosClient = client

        return this
    },
    fingerprintRequestsUsing(callback) {
        requestFingerprintResolver = callback === null
            ? () => null
            : callback

        return this
    },
    autoValidateParentKeys(value = true) {
        autoValidateParentKeys = value

        return this
    }
}

/**
 * Send and handle a new request.
 */
const request = (userConfig: Config = {}): Promise<unknown> => {
    const config = [
        resolveConfig,
        abortMatchingRequests,
        refreshAbortController,
    ].reduce((config, f) => f(config), userConfig)

    if (config.onBefore) {
        config.onBefore()
    }

    return client.axios().request(config).then(response => {
        validatePrecognitionResponse(response)

        const statusHandler = resolveStatusHandler(config, response.status)

        return statusHandler ? statusHandler(response) : response
    }, error => {
        if (isNotServerGeneratedError(error)) {
            return Promise.reject(error)
        }

        validatePrecognitionResponse(error.response)

        const statusHandler = resolveStatusHandler(config, error.response.status)

        return statusHandler ? statusHandler(error.response, error) : Promise.reject(error)
    }).then(response => {
        return config.onAfter ? config.onAfter(Promise.resolve(response)) : response
    }, error => {
        return config.onAfter ? config.onAfter(Promise.reject(error)) : Promise.reject(error)
    })
}

/**
 * Abort an existing request with the same configured fingerprint.
 */
const abortMatchingRequests = (config: Config): Config => {
    if (typeof config.fingerprint === 'string') {
        abortControllers[config.fingerprint]?.abort()
        delete abortControllers[config.fingerprint]
    }

    return config
}

/**
 * Create and configure the abort controller for a new request.
 */
const refreshAbortController = (config: Config): Config => {
    if (
        typeof config.fingerprint === 'string'
        && ! config.signal
        && ! config.cancelToken
    ) {
        abortControllers[config.fingerprint] = new AbortController
        config.signal = abortControllers[config.fingerprint].signal
    }

    return config
}

/**
 * Ensure that the response is a Precognition response.
 */
const validatePrecognitionResponse = (response: AxiosResponse): void => {
    if (response.headers?.precognition !== 'true') {
        throw Error('Did not receive a Precognition response. Ensure you have the Precognition middleware in place for the route.')
    }
}

/**
 * Determine if the error was not triggered by a server response.
 */
const isNotServerGeneratedError = (error: AxiosError): boolean => {
    return ! Axios.isAxiosError(error) || Axios.isCancel(error) || typeof error.response?.status !== 'number'
}

/**
 * Resolve the configuration.
 */
const resolveConfig = (config: Config): Config => ({
    fingerprint: config.fingerprint === undefined
        ? requestFingerprintResolver(config, client.axios())
        : config.fingerprint,
    ...config,
    headers: {
        ...config.headers,
        Precognition: true,
        ...config.validate ? {
            'Precognition-Validate-Only': resolveKeysToValidate(config).join(),
        } : {},
    },
})

const resolveKeysToValidate = (config: Config): Array<string> => {
    const resolveParents = config.autoValidateParentKeys ?? autoValidateParentKeys;

    if (! resolveParents) {
        return Array.from(config.validate ?? [])
    }

    const rules = Array.from(config.validate ?? []).flatMap(rule => rule.split(/(?<!\\)\./)
        .reduce((accumulator: Array<string>, currentValue: string) => {
            if (accumulator.length === 0) {
                accumulator.push(currentValue)
            } else {
                accumulator.push(`${accumulator[accumulator.length - 1]}.${currentValue}`)
            }

            return accumulator
        }, []))

    return Array.from(new Set(rules))
}

/**
 * Resolve the handler for the given HTTP response status.
 */
const resolveStatusHandler = (config: Config, code: number): StatusHandler|undefined => ({
    204: config.onPrecognitionSuccess,
    401: config.onUnauthorized,
    403: config.onForbidden,
    404: config.onNotFound,
    409: config.onConflict,
    422: config.onValidationError,
    423: config.onLocked,
}[code])
