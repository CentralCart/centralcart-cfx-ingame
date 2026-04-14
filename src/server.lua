local cachedCategories = nil
local detectedFramework = nil
local vRP = nil
local QBCore = nil
local cachedCategoryPackages = {}
local API_BASE = 'https://api.centralcart.io/v1'

local function cleanDomain(domain)
    if not domain then return '' end
    return domain:gsub('^https?://', ''):gsub('/+$', '')
end

local function detectFramework()
    local fw = CentralCart.framework or 'auto'

    if fw == 'auto' then
        if GetResourceState('vrp') == 'started' then
            fw = 'vrp-default'
        elseif GetResourceState('qb-core') == 'started' then
            fw = 'qbcore'
        end
    end

    if fw == 'blank' then
        detectedFramework = 'custom'
        print('^2[CentralCart] Framework Customizada: (Personalize a função: customGetPlayerId)^0')
    elseif fw == 'vrp' or fw == 'vrp-default' or fw == 'vrp-creative_3' or fw == 'vrp-creative_4' or fw == 'vrp-creative_5' or fw == 'vrp-creative_network' then
        local ok, result = pcall(function()
            local Proxy = module("vrp", "lib/Proxy")
            return Proxy.getInterface("vRP")
        end)
        if ok and result then
            vRP = result
        else
            local ok2, result2 = pcall(function()
                return exports.vrp:getInterface('vRP')
            end)
            if ok2 and result2 then
                vRP = result2
            end
        end
        detectedFramework = 'vrp'
        print('^2[CentralCart] Framework detectado: vRP (' .. fw .. ')^0')
    elseif fw == 'qbcore' then
        QBCore = exports['qb-core']:GetCoreObject()
        detectedFramework = 'qbcore'
        print('^2[CentralCart] Framework detectado: QBCore^0')
    else
        detectedFramework = nil
        print('^3[CentralCart] Nenhum framework detectado.^0')
    end
end

local discordDbQueries = {
    { query = "SELECT discord FROM summerz_accounts WHERE steam = @val", param = "steam" },
    { query = "SELECT discord FROM summerz_accounts WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM vrp_users WHERE id = @val", param = "id" },
    { query = "SELECT discord FROM vrp_users WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM vrp_account WHERE id = @val", param = "id" },
    { query = "SELECT discord FROM vrp_account WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM vrp_users_conta WHERE token = @val", param = "id" },
    { query = "SELECT discord FROM users WHERE id = @val", param = "id" },
    { query = "SELECT discord FROM users WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM accounts WHERE id = @val", param = "id" },
    { query = "SELECT discord FROM accounts WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM users WHERE identifier = @val", param = "license" },
    { query = "SELECT discord FROM players WHERE citizenid = @val", param = "id" },
    { query = "SELECT discord FROM players WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM characters WHERE id = @val", param = "id" },
    { query = "SELECT discord FROM characters WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM user_ids WHERE identifier = @val", param = "license" },
    { query = "SELECT discord FROM user_accounts WHERE license = @val", param = "license" },
    { query = "SELECT discord FROM user_accounts WHERE steam = @val", param = "steam" },
    { query = "SELECT discord_id as discord FROM users WHERE id = @val", param = "id" },
    { query = "SELECT discord_id as discord FROM accounts WHERE id = @val", param = "id" },
    { query = "SELECT identifier as discord FROM user_identifiers WHERE identifier LIKE 'discord:%' AND user_id = @val", param = "id" },
    { query = "SELECT value as discord FROM identifiers WHERE type = 'discord' AND owner = @val", param = "id" }
}

local getPlayerId

local function getPlayerDiscord(source)
    local discord = GetPlayerIdentifierByType(source, 'discord')
    if discord then
        return discord:gsub('discord:', '')
    end
    if GetResourceState('oxmysql') ~= 'started' then return nil end
    local playerId = getPlayerId(source)
    local identifiers = {
        license = GetPlayerIdentifierByType(source, 'license'),
        steam = GetPlayerIdentifierByType(source, 'steam'),
        fivem = GetPlayerIdentifierByType(source, 'fivem'),
        passaporte = playerId,
        id = playerId,
    }
    for _, entry in ipairs(discordDbQueries) do
        local val = identifiers[entry.param]
        if val then
            local ok, result = pcall(function()
                return exports.oxmysql:query_async(entry.query, { ['@val'] = val })
            end)
            if ok and result and result[1] then
                local row = result[1]
                local disc = nil
                for key, value in pairs(row) do
                    if key:lower() == 'discord' then
                        disc = tostring(value)
                        break
                    end
                end
                if disc and disc ~= '' and disc ~= 'nil' and disc ~= 'null' then
                    return disc:gsub('discord:', '')
                end
            end
        end
    end
    return nil
end

getPlayerId = function(source)
    if not detectedFramework then return nil end

    if detectedFramework == 'custom' then
        if CentralCart.customGetPlayerId then
            local ok, result = pcall(CentralCart.customGetPlayerId, source)
            if ok and result then
                return tostring(result)
            end
        end
        return nil
    elseif detectedFramework == 'vrp' and vRP then
        local user_id = vRP.getUserId(source) or vRP.Passport(source)
        return user_id and tostring(user_id) or nil
    elseif detectedFramework == 'qbcore' and QBCore then
        local player = QBCore.Functions.GetPlayer(source)
        if player then
            return player.PlayerData.citizenid
        end
    end

    return nil
end

function WebstoreRequest(endpoint, cb)
    local url = API_BASE .. endpoint
    PerformHttpRequest(url, function(statusCode, response, headers)
        if statusCode == 200 and response then
            local data = json.decode(response)
            cb(data)
        else
            cb(nil)
        end
    end, 'GET', '', {
        ['x-store-domain'] = cleanDomain(CentralCart.store),
        ['Content-Type'] = 'application/json',
        ['Accept'] = 'application/json',
    })
end

function FetchStoreData(cb)
    WebstoreRequest('/webstore/category?include_sub_categories=true', function(categories)
        if categories then
            cachedCategories = type(categories) == 'table' and categories.data or categories
            if not cachedCategories then cachedCategories = categories end
        end

        WebstoreRequest('/webstore', function(storeInfo)
            WebstoreRequest('/webstore/gateway', function(gateways)
                cb(cachedCategories, storeInfo, gateways)
            end)
        end)
    end)
end

RegisterNetEvent('centralcart:requestStoreData')
AddEventHandler('centralcart:requestStoreData', function()
    local src = source

    FetchStoreData(function(categories, storeInfo, gateways)
        TriggerClientEvent('centralcart:receiveStoreData', src, categories, storeInfo, gateways)
    end)
end)

RegisterNetEvent('centralcart:requestCategoryPackages')
AddEventHandler('centralcart:requestCategoryPackages', function(categoryId)
    local src = source
    if not categoryId then return end

    if cachedCategoryPackages[categoryId] then
        TriggerClientEvent('centralcart:categoryPackages', src, categoryId, cachedCategoryPackages[categoryId])
        return
    end

    WebstoreRequest('/webstore/package?category_id=' .. tostring(categoryId) .. '&limit=999', function(response)
        local packages = {}
        if response then
            packages = type(response) == 'table' and response.data or response
            if not packages then packages = response end
        end
        cachedCategoryPackages[categoryId] = packages
        TriggerClientEvent('centralcart:categoryPackages', src, categoryId, packages)
    end)
end)

RegisterNetEvent('centralcart:getPlayerId')
AddEventHandler('centralcart:getPlayerId', function()
    local src = source
    local playerId = getPlayerId(src)
    local discord = getPlayerDiscord(src)
    TriggerClientEvent('centralcart:playerId', src, playerId, discord)
end)

AddEventHandler('playerJoining', function()
    local src = source
    Wait(5000)
    local playerId = getPlayerId(src)
    local discord = getPlayerDiscord(src)
    TriggerClientEvent('centralcart:storeStatus', src, false, playerId, discord)
end)

RegisterNetEvent('centralcart:checkout')
AddEventHandler('centralcart:checkout', function(checkoutData)
    local src = source

    local items = {}
    for _, item in ipairs(checkoutData.cart or {}) do
        table.insert(items, {
            package_id = item.package_id,
            quantity = item.quantity,
        })
    end

    local bodyTable = {
        cart = items,
        gateway = checkoutData.gateway,
        client_name = checkoutData.client_name,
        client_email = checkoutData.client_email,
        terms = true,
    }

    if checkoutData.client_document and checkoutData.client_document ~= '' then
        bodyTable.client_document = checkoutData.client_document
    end
    if checkoutData.client_phone and checkoutData.client_phone ~= '' then
        bodyTable.client_phone = checkoutData.client_phone
    end
    if checkoutData.coupon and checkoutData.coupon ~= '' then
        bodyTable.coupon = checkoutData.coupon
    end
    if checkoutData.variables then
        bodyTable.variables = checkoutData.variables
    end

    local body = json.encode(bodyTable)

    local url = API_BASE .. '/webstore/checkout'
    PerformHttpRequest(url, function(statusCode, response, headers)
        if statusCode == 200 or statusCode == 201 then
            local data = json.decode(response)
            if data then
                TriggerClientEvent('centralcart:checkoutResult', src, true, {
                    checkout_url = data.checkout_url or nil,
                    pix_code = data.pix_code or nil,
                    qr_code = data.qr_code or nil,
                    formatted_price = data.formatted_price or nil,
                    order_id = data.order_id or nil,
                    status = data.status or nil,
                })
            else
                TriggerClientEvent('centralcart:checkoutResult', src, false, nil)
            end
        else
            TriggerClientEvent('centralcart:checkoutResult', src, false, nil)
        end
    end, 'POST', body, {
        ['x-store-domain'] = cleanDomain(CentralCart.store),
        ['Content-Type'] = 'application/json',
        ['Accept'] = 'application/json',
    })
end)

RegisterNetEvent('centralcart:checkOrderStatus')
AddEventHandler('centralcart:checkOrderStatus', function(orderId)
    local src = source
    if not orderId then return end

    WebstoreRequest('/webstore/order_status/' .. tostring(orderId), function(data)
        if data then
            local status = data.status or (data.order and data.order.status) or nil
            TriggerClientEvent('centralcart:orderStatus', src, orderId, status)
        end
    end)
end)

CreateThread(function()
    Wait(2000)
    detectFramework()
    TriggerEvent("centralcart.igs.ready", GetCurrentResourceName())
end)

