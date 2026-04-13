fx_version 'cerulean'
game 'gta5'

name 'centralcart-cfx-ingame'
description 'CentralCart Ingame'
version '1.0.0'

shared_script 'config.lua'

client_script 'src/client.lua'

server_scripts {
    '@vrp/lib/utils.lua',
    'src/server.lua',
}

ui_page 'nui/index.html'

files {
    'nui/index.html',
    'nui/css/style.css',
    'nui/js/centralcart.js',
    'nui/js/templates/**/**.js',
    'nui/js/app.js',
    'nui/images/*.png',
    'nui/images/*.jpg',
    'nui/images/*.svg',
}
