// Open external navigation links in new tab
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('#tsd-toolbar-links a[href^="http"]').forEach(function(link) {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });
});
