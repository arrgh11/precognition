import precognition from './precognition.js'

document.addEventListener('alpine:init', () => {
    window.Alpine.plugin(precognition);
})