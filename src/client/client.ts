import { Config } from '../shared/config';

let ESX: any = null;
let tabletProp: number | null = null; 

const getESX = () => {
    if (ESX) return ESX;
    try { ESX = (exports as any)["es_extended"].getSharedObject(); } catch (e) { emit('esx:getSharedObject', (obj: any) => { ESX = obj; }); }
    return ESX;
};

let warehouseBlip: number | null = null;

function clearTablet() {
    const playerPed = PlayerPedId();
    ClearPedTasks(playerPed);
    if (tabletProp && DoesEntityExist(tabletProp)) {
        DeleteEntity(tabletProp);
    }
    tabletProp = null;
}

setTick(async () => {
    if (warehouseBlip === null) {
        warehouseBlip = AddBlipForCoord(Config.PickupLocation.x, Config.PickupLocation.y, Config.PickupLocation.z);
        SetBlipSprite(warehouseBlip, Config.Blip.Sprite);
        SetBlipColour(warehouseBlip, Config.Blip.Color);
        SetBlipScale(warehouseBlip, Config.Blip.Scale);
        SetBlipAsShortRange(warehouseBlip, true);
        BeginTextCommandSetBlipName("STRING");
        AddTextComponentString(Config.Blip.Label);
        EndTextCommandSetBlipName(warehouseBlip);
    }

    const playerPed = PlayerPedId();
    const coords = GetEntityCoords(playerPed, true);
    const dist = Vdist(coords[0], coords[1], coords[2], Config.PickupLocation.x, Config.PickupLocation.y, Config.PickupLocation.z);

    if (dist < 20.0) {
        DrawMarker(27, Config.PickupLocation.x, Config.PickupLocation.y, Config.PickupLocation.z - 0.98, 0, 0, 0, 0, 0, 0, 1.0, 1.0, 1.0, 162, 155, 254, 150, false, false, 2, false, null, null, false);
        
        if (dist < 1.5) {
            BeginTextCommandDisplayHelp("STRING");
            AddTextComponentString("Drücke ~INPUT_CONTEXT~ für Paketausgabe");
            EndTextCommandDisplayHelp(0, false, true, -1);

            if (IsControlJustReleased(0, 38)) {
                const esxObj = getESX();
                if (esxObj) esxObj.TriggerServerCallback("armersohn:getOrders", (orders: any) => {
                    SetNuiFocus(true, true);
                    SendNUIMessage({ action: "openPickup", orders: orders });
                });
            }
        }
    } else { 
        await new Promise(r => setTimeout(r, 1000)); 
    }
});

RegisterCommand("shop", async () => {
    const playerPed = PlayerPedId();
    const coords = GetEntityCoords(playerPed, true);
    
    clearTablet();

    const animDict = "amb@world_human_seat_wall_tablet@female@base";
    const modelHash = GetHashKey("prop_cs_tablet");

    RequestAnimDict(animDict);
    while (!HasAnimDictLoaded(animDict)) await new Promise(r => setTimeout(r, 10));

    RequestModel(modelHash);
    while (!HasModelLoaded(modelHash)) await new Promise(r => setTimeout(r, 10));

    tabletProp = CreateObject(modelHash, coords[0], coords[1], coords[2], true, true, false);
    const boneIndex = GetPedBoneIndex(playerPed, 28422);
    AttachEntityToEntity(tabletProp, playerPed, boneIndex, 0.0, 0.0, 0.03, 0.0, 0.0, 0.0, true, true, false, true, 1, true);

    TaskPlayAnim(playerPed, animDict, "base", 8.0, -8.0, -1, 50, 0, false, false, false);

    SetNuiFocus(true, true);
    SendNUIMessage({
        action: "open",
        items: Config.Items 
    });
}, false);

RegisterNuiCallback("claim", (data: any, cb: any) => { 
    TriggerServerEvent("armersohn:claimItems", data.items); 
    cb("ok"); 
});

RegisterNuiCallback("checkout", (data: any, cb: any) => { 
    TriggerServerEvent("armersohn:finalCheckout", data.items, data.delivery); 
    cb("ok"); 
});

RegisterNuiCallback("purchase", (data: any, cb: any) => { 
    TriggerServerEvent("armersohn:purchase", data); 
    cb("ok"); 
});

RegisterNuiCallback("close", (data: any, cb: any) => { 
    SetNuiFocus(false, false);
    try { clearTablet(); } catch (e) { console.log(e); }
    cb("ok"); 
});

onNet("armersohn:spawnVehicle", async (model: string, plate: string, color: any, isDelivery: boolean) => {
    const hash = GetHashKey(model);
    RequestModel(hash);
    while (!HasModelLoaded(hash)) await new Promise(r => setTimeout(r, 10));

    const p = PlayerPedId();
    let sPos, sH;

    if (isDelivery) {
        const f = GetEntityForwardVector(p); 
        const c = GetEntityCoords(p, true);
        sPos = { x: c[0] + f[0] * 4, y: c[1] + f[1] * 4, z: c[2] }; 
        sH = GetEntityHeading(p);
    } else {
        sPos = { x: Config.PickupLocation.x, y: Config.PickupLocation.y, z: Config.PickupLocation.z }; 
        sH = 172.91;
    }

    const veh = CreateVehicle(hash, sPos.x, sPos.y, sPos.z, sH, true, false);
    SetVehicleNumberPlateText(veh, plate?.toUpperCase() || "ARMER");
    
    if (color) { 
        SetVehicleCustomPrimaryColour(veh, color.r, color.g, color.b); 
        SetVehicleCustomSecondaryColour(veh, color.r, color.g, color.b); 
    }
    
    TaskWarpPedIntoVehicle(p, veh, -1);
});