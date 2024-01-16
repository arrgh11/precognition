import form from 'index.js'

document.addEventListener('alpine:init', () => {
    window.Alpine.plugin(form)
})