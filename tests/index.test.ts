import axios from 'axios'
import precognition from '../src/index'

jest.mock('axios')
precognition.use(axios)
jest.useFakeTimers()
jest.spyOn(global, 'setTimeout')

test('success response must have Precognition header', async () => {
    expect.assertions(2)

    axios.request.mockResolvedValueOnce({ headers: {} })

    await precognition.get('https://laravel.com').catch((e) => {
        expect(e).toBeInstanceOf(Error)
        expect(e.message).toBe('Did not receive a Precognition response. Ensure you have the Precognition middleware in place for the route.')
    })
})

test('error response must have Precognition header', async () => {
    expect.assertions(2)

    axios.request.mockRejectedValueOnce({ response: { status: 500 } })
    axios.isAxiosError.mockReturnValue(true)

    await precognition.get('https://laravel.com').catch((e) => {
        expect(e).toBeInstanceOf(Error)
        expect(e.message).toBe('Did not receive a Precognition response. Ensure you have the Precognition middleware in place for the route.')
    })
})

test('unknown error is rejected again', async () => {
    expect.assertions(1)

    const error = { expected: 'error' }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(false)

    await precognition.get('https://laravel.com').catch((e) => {
        expect(e).toBe(error)
    })
})

test('test canceled request is rejected again', async () => {
    expect.assertions(1)

    const error = { expected: 'error' }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)
    axios.isCancel.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com').catch((e) => {
        expect(e).toBe(error)
    })
})

test('axios error without status is rejected', async () => {
    expect.assertions(1)

    const error = { expected: 'error' }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com').catch((e) => {
        expect(e).toBe(error)
    })
})

test('it does not have to provide a success handler', async () => {
    expect.assertions(1)

    const response = { headers: { precognition: 'true' }, status: 204, data: 'expected data' }
    axios.request.mockResolvedValueOnce(response)

    await precognition.get('https://laravel.com').then(r => expect(r).toBe(response))
})

test('it can provide a onPrecognitionSuccess handler', async () => {
    expect.assertions(3)

    const response = { headers: { precognition: 'true' }, status: 204, data: 'expected data' }
    axios.request.mockResolvedValueOnce(response)

    await precognition.get('https://laravel.com', {
        onPrecognitionSuccess: (r, e) => {
            expect(r).toBe(response)
            expect(e).toBeUndefined()

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it does not have to provide an error handler', async () => {
    expect.assertions(1)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 422,
            data: {
                message: 'expected message',
                errors: { name: ['expected error'] },
            },
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com').catch(e => expect(e).toBe(error))
})

test('it can provide an onValidationError handler', async () => {
    expect.assertions(3)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 422,
            data: {
                message: 'expected message',
                errors: { name: ['expected error'] },
            },
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com', {
        onValidationError: (p, e) => {
            expect(p).toBe(error.response)
            expect(e).toBe(error)

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it can provide an onUnauthorized handler', async () => {
    expect.assertions(3)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 401,
            data: 'expected data',
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com', {
        onUnauthorized: (p, e) => {
            expect(p).toBe(error.response)
            expect(e).toBe(error)

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it can provide an onForbidden handler', async () => {
    expect.assertions(3)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 403,
            data: 'expected data',
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com', {
        onForbidden: (p, e) => {
            expect(p).toBe(error.response)
            expect(e).toBe(error)

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it can provide an onNotFound handler', async () => {
    expect.assertions(3)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 404,
            data: 'expected data',
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com', {
        onNotFound: (p, e) => {
            expect(p).toBe(error.response)
            expect(e).toBe(error)

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it can provide an onConflict handler', async () => {
    expect.assertions(3)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 409,
            data: 'expected data',
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com', {
        onConflict: (p, e) => {
            expect(p).toBe(error.response)
            expect(e).toBe(error)

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it can provide an onLocked handler', async () => {
    expect.assertions(3)

    const error = {
        response: {
            headers: { precognition: 'true' },
            status: 423,
            data: 'expected data',
        },
    }
    axios.request.mockRejectedValueOnce(error)
    axios.isAxiosError.mockReturnValueOnce(true)

    await precognition.get('https://laravel.com', {
        onLocked: (p, e) => {
            expect(p).toBe(error.response)
            expect(e).toBe(error)

            return 'expected return'
        },
    }).then(value => expect(value).toBe('expected return'))
})

test('it can provide a list of inputs to validate', async () => {
    expect.assertions(1)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('https://laravel.com', {
        validate: ['username', 'email'],
    })

    expect(config.headers['Precognition-Validate-Only']).toBe('username,email')
})

test('it creates request identifier and adds signal', async () => {
    expect.assertions(2)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('https://laravel.com')

    expect(config.fingerprint).toBe('get:https://laravel.com')
    expect(config.signal).toBeInstanceOf(AbortSignal)
})

test('it uses baseURL from axios in request identifier', async () => {
    expect.assertions(2)

    let config
    axios.defaults.baseURL = 'https://laravel.com'
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('/docs')

    expect(config.fingerprint).toBe('get:https://laravel.com/docs')
    expect(config.signal).toBeInstanceOf(AbortSignal)
})

test('it config baseURL takes precedence for request id', async () => {
    expect.assertions(2)

    let config
    axios.defaults.baseURL = 'https://laravel.com'
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('/docs', {
        baseURL: 'https://forge.laravel.com',
    })

    expect(config.fingerprint).toBe('get:https://forge.laravel.com/docs')
    expect(config.signal).toBeInstanceOf(AbortSignal)
})

test('it can pass request identifier to config', async () => {
    expect.assertions(2)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('/docs', {
        fingerprint: 'expected-id',
    })

    expect(config.fingerprint).toBe('expected-id')
    expect(config.signal).toBeInstanceOf(AbortSignal)
})

test('it set request identifier resolver', async () => {
    expect.assertions(2)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })
    precognition.fingerprintRequestsUsing(() => 'expected-id')

    await precognition.get('/docs')

    expect(config.fingerprint).toBe('expected-id')
    expect(config.signal).toBeInstanceOf(AbortSignal)
})

test('it config fingerprint takes precedence for request id', async () => {
    expect.assertions(2)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })
    precognition.fingerprintRequestsUsing(() => 'foo')

    await precognition.get('/docs', {
        fingerprint: 'expected-id',
    })

    expect(config.fingerprint).toBe('expected-id')
    expect(config.signal).toBeInstanceOf(AbortSignal)
})

test('it can opt out of signals with `null`', async () => {
    expect.assertions(2)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('/docs', {
        fingerprint: null,
    })

    expect(config.fingerprint).toBe(null)
    expect(config.signal).toBeUndefined()
})

test('it does not create signal when one is provided', async () => {
    expect.assertions(1)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })
    let called = false
    const controller = new AbortController
    controller.signal.addEventListener('foo', () => {
        called = true
    })

    await precognition.get('/docs', {
        signal: controller.signal,
    })
    config.signal.dispatchEvent(new Event('foo'))

    expect(called).toBe(true)
})

test('it does not create signal when a cancelToken is provided', async () => {
    expect.assertions(1)

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('/docs', {
        cancelToken: { /* ... */ },
    })

    expect(config.signal).toBeUndefined()
})

test('it can auto validate parent keys', async () => {
    expect.assertions(1)

    precognition.autoValidateParentKeys()

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('https://laravel.com', {
        validate: ['members.0.name', 'members.1.email', 'email'],
    })

    expect(config.headers['Precognition-Validate-Only']).toBe('members,members.0,members.0.name,members.1,members.1.email,email')
})

test('it does not split escaped dots when auto validating parent keys', async () => {
    expect.assertions(1)

    precognition.autoValidateParentKeys()

    let config
    axios.request.mockImplementationOnce((c) => {
        config = c
        return Promise.resolve({ headers: { precognition: 'true' } })
    })

    await precognition.get('https://laravel.com', {
        validate: ['members.0.name', 'members\\.1\\.email', 'email'],
    })

    expect(config.headers['Precognition-Validate-Only']).toBe('members,members.0,members.0.name,members\\.1\\.email,email')
})
