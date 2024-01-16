import { client, createValidator, resolveName, toSimpleValidationErrors, resolveUrl, resolveMethod } from 'laravel-precognition';
import cloneDeep from 'lodash.clonedeep';
import get from 'lodash.get';
import set from 'lodash.set';
export { client };
export default function (Alpine) {
    Alpine.magic('form', (el) => (method, url, inputs, config = {}) => {
        /**
         * The original data.
         */
        const originalData = cloneDeep(inputs);
        /**
         * The original input names.
         */
        const originalInputs = Object.keys(originalData);
        /**
         * Internal reactive state.
         */
        const state = Alpine.reactive({
            touched: [],
            valid: [],
        });
        /**
         * The validator instance.
         */
        const validator = createValidator(client => client[resolveMethod(method)](resolveUrl(url), form.data(), config), originalData)
            .on('validatingChanged', () => {
            form.validating = validator.validating();
        })
            .on('validatedChanged', () => {
            state.valid = validator.valid();
        })
            .on('touchedChanged', () => {
            state.touched = validator.touched();
        })
            .on('errorsChanged', () => {
            form.hasErrors = validator.hasErrors();
            form.errors = toSimpleValidationErrors(validator.errors());
            state.valid = validator.valid();
        });
        /**
         * Resolve the config for a form submission.
         */
        const resolveSubmitConfig = (config) => ({
            ...config,
            precognitive: false,
            onStart: () => {
                form.processing = true;
                (config.onStart ?? (() => null))();
            },
            onFinish: () => {
                form.processing = false;
                (config.onFinish ?? (() => null))();
            },
            onValidationError: (response, error) => {
                validator.setErrors(response.data.errors);
                return config.onValidationError
                    ? config.onValidationError(response)
                    : Promise.reject(error);
            },
        });
        /**
         * Create a new form instance.
         */
        const createForm = () => ({
            ...cloneDeep(inputs),
            data() {
                const newForm = cloneDeep(form);
                return originalInputs.reduce((carry, name) => ({
                    ...carry,
                    [name]: newForm[name],
                }), {});
            },
            touched(name) {
                return state.touched.includes(name);
            },
            touch(name) {
                validator.touch(name);
                return form;
            },
            validate(name) {
                if (typeof name === 'undefined') {
                    validator.validate();
                }
                else {
                    name = resolveName(name);
                    validator.validate(name, get(form.data(), name));
                }
                return form;
            },
            validating: false,
            valid(name) {
                return state.valid.includes(name);
            },
            invalid(name) {
                return typeof form.errors[name] !== 'undefined';
            },
            errors: {},
            hasErrors: false,
            setErrors(errors) {
                validator.setErrors(errors);
                return form;
            },
            forgetError(name) {
                validator.forgetError(name);
                return form;
            },
            reset(...names) {
                const original = cloneDeep(originalData);
                if (names.length === 0) {
                    // @ts-expect-error
                    originalInputs.forEach(name => (form[name] = original[name]));
                }
                else {
                    names.forEach(name => set(form, name, get(original, name)));
                }
                validator.reset(...names);
                return form;
            },
            setValidationTimeout(duration) {
                validator.setTimeout(duration);
                return form;
            },
            processing: false,
            async submit(config = {}) {
                return client[resolveMethod(method)](resolveUrl(url), form.data(), resolveSubmitConfig(config));
            },
            validateFiles() {
                validator.validateFiles();
                return form;
            },
        });
        /**
         * The form instance.
         */
        const form = Alpine.reactive(createForm());
        syncWithDom(el, resolveMethod(method), resolveUrl(url), form);
        return form;
    });
}
/**
 * Sync the DOM form with the Precognitive form.
 */
const syncWithDom = (el, method, url, form) => {
    if (!(el instanceof Element && el.nodeName === 'FORM')) {
        return;
    }
    syncSyntheticMethodInput(el, method);
    syncMethodAttribute(el, method);
    syncActionAttribute(el, url);
    addProcessingListener(el, form);
};
/**
 * Sync the form's "method" attribute.
 */
const syncMethodAttribute = (el, method) => {
    if (method !== 'get' && !el.hasAttribute('method')) {
        el.setAttribute('method', 'POST');
    }
};
/**
 * Sync the form's "action" attribute.
 */
const syncActionAttribute = (el, url) => {
    if (!el.hasAttribute('action')) {
        el.setAttribute('action', url);
    }
};
/**
 * Sync the form's sythentic "method" input.
 */
const syncSyntheticMethodInput = (el, method) => {
    if (['get', 'post'].includes(method)) {
        return;
    }
    const existing = el.querySelector('input[type="hidden"][name="_method"]');
    if (existing !== null) {
        return;
    }
    const input = el.insertAdjacentElement('afterbegin', document.createElement('input'));
    if (input === null) {
        return;
    }
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', '_method');
    input.setAttribute('value', method.toUpperCase());
};
/**
 * Add processing listener.
 */
const addProcessingListener = (el, form) => el.addEventListener('submit', () => (form.processing = true));
