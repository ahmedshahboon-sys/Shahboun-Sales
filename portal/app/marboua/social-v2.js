// Legacy compatibility entrypoint. Old index.html redirects to the clean v14 runtime.
if(!location.pathname.endsWith('/index-v14.html'))location.replace('./index-v14.html');