local isOpen = false
local cachedPlayerId = nil
local isStoreBlocked = nil

RegisterNUICallback('close', function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('checkout', function(data, cb)
    TriggerServerEvent('centralcart:checkout', data)
    cb('ok')
end)

RegisterNetEvent('centralcart:receiveStoreData')
AddEventHandler('centralcart:receiveStoreData', function(categories, storeInfo, gateways)
    SendNUIMessage({
        action = 'storeData',
        categories = categories,
        storeInfo = storeInfo,
        gateways = gateways,
    })
end)

RegisterNUICallback('requestCategoryPackages', function(data, cb)
    TriggerServerEvent('centralcart:requestCategoryPackages', data.categoryId)
    cb('ok')
end)

RegisterNetEvent('centralcart:categoryPackages')
AddEventHandler('centralcart:categoryPackages', function(categoryId, packages)
    SendNUIMessage({
        action = 'categoryPackages',
        categoryId = categoryId,
        packages = packages,
    })
end)

RegisterNUICallback('checkOrderStatus', function(data, cb)
    TriggerServerEvent('centralcart:checkOrderStatus', data.orderId)
    cb('ok')
end)

RegisterNetEvent('centralcart:orderStatus')
AddEventHandler('centralcart:orderStatus', function(orderId, status)
    SendNUIMessage({
        action = 'orderStatus',
        orderId = orderId,
        status = status,
    })
end)

RegisterNetEvent('centralcart:checkoutResult')
AddEventHandler('centralcart:checkoutResult', function(success, data)
    SendNUIMessage({
        action = 'checkoutResult',
        success = success,
        data = data,
    })
end)

local cachedDiscord = nil

RegisterNetEvent('centralcart:storeStatus')
AddEventHandler('centralcart:storeStatus', function(blocked, playerId, discord)
    isStoreBlocked = blocked
    cachedPlayerId = playerId
    cachedDiscord = discord
    if blocked then return end

    if not isOpen then return end
    SendNUIMessage({
        action = 'playerId',
        playerId = playerId,
        discord = discord,
    })
end)

RegisterNetEvent('centralcart:playerId')
AddEventHandler('centralcart:playerId', function(playerId, discord)
    cachedPlayerId = playerId
    cachedDiscord = discord
    SendNUIMessage({
        action = 'playerId',
        playerId = playerId,
        discord = discord,
    })
end)

function OpenStore()
    if isOpen then return end
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        colors = CentralCart.colors or {},
        template = CentralCart.template or 'default',
        storeDomain = CentralCart.store or '',
        playerId = cachedPlayerId,
        discord = cachedDiscord,
    })
    TriggerServerEvent('centralcart:requestStoreData')
    TriggerServerEvent('centralcart:getPlayerId')
end

RegisterCommand(CentralCart.command or 'loja', function()
    OpenStore()
end, false)

function OpenProduct(packageId)
    if isOpen then return end
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'openProduct',
        colors = CentralCart.colors or {},
        template = CentralCart.template or 'default',
        storeDomain = CentralCart.store or '',
        playerId = cachedPlayerId,
        discord = cachedDiscord,
        packageId = packageId,
    })
    TriggerServerEvent('centralcart:requestStoreData')
    TriggerServerEvent('centralcart:getPlayerId')
end

exports('open', OpenStore)
exports('openProduct', OpenProduct)
-- exports['centralcart-cfx-ingame']:open()
-- exports['centralcart-cfx-ingame']:openProduct(123456)
