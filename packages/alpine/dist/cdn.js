import precognition from './precognition'

document.addEventListener('alpine:init', () => {
    window.Alpine.plugin(precognition);
})