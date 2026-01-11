"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/shared/config.ts
  var Config;
  var init_config = __esm({
    "src/shared/config.ts"() {
      "use strict";
      Config = {
        // Koordinaten der Packstation / Lager
        PickupLocation: { x: 1704.25, y: 3265, z: 41.14 },
        Blip: {
          Sprite: 478,
          Color: 5,
          Scale: 0.8,
          Label: "Armersohn Packstation"
        },
        Items: [
          { label: "Flasche Wasser", item: "water", price: 4, icon: "fas fa-bottle-water", category: "items" },
          { label: "St\xFCck Brot", item: "bread", price: 2, icon: "fas fa-bread-slice", category: "items" },
          { label: "Modernes Lungenbr\xF6tchen", item: "vape", price: 5, icon: "fas fa-smog", category: "items" },
          { label: "Verbandskasten", item: "medikit", price: 10, icon: "fas fa-first-aid", category: "items" },
          { label: "Pistole", item: "WEAPON_PISTOL", price: 1e3, icon: "fas fa-gun", category: "weapons" },
          { label: "Messer", item: "WEAPON_KNIFE", price: 150, icon: "fas fa-utensils", category: "weapons" },
          { label: "Arschkarre", item: "tailgater", price: 1, icon: "fas fa-car", category: "cars", stats: { speed: 65, handling: 45 } },
          { label: "Cards Senti", item: "sentinel3", price: 2, icon: "fas fa-car-side", category: "cars", stats: { speed: 82, handling: 60 } },
          { label: "Bati", item: "bati", price: 3, icon: "fas fa-motorcycle", category: "cars", stats: { speed: 95, handling: 85 } }
        ]
      };
    }
  });

  // src/client/client.ts
  var require_client = __commonJS({
    "src/client/client.ts"(exports) {
      init_config();
      var ESX = null;
      var tabletProp = null;
      var getESX = () => {
        if (ESX) return ESX;
        try {
          ESX = exports["es_extended"].getSharedObject();
        } catch (e) {
          emit("esx:getSharedObject", (obj) => {
            ESX = obj;
          });
        }
        return ESX;
      };
      var warehouseBlip = null;
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
        if (dist < 20) {
          DrawMarker(27, Config.PickupLocation.x, Config.PickupLocation.y, Config.PickupLocation.z - 0.98, 0, 0, 0, 0, 0, 0, 1, 1, 1, 162, 155, 254, 150, false, false, 2, false, null, null, false);
          if (dist < 1.5) {
            BeginTextCommandDisplayHelp("STRING");
            AddTextComponentString("Dr\xFCcke ~INPUT_CONTEXT~ f\xFCr Paketausgabe");
            EndTextCommandDisplayHelp(0, false, true, -1);
            if (IsControlJustReleased(0, 38)) {
              const esxObj = getESX();
              if (esxObj) esxObj.TriggerServerCallback("armersohn:getOrders", (orders) => {
                SetNuiFocus(true, true);
                SendNUIMessage({ action: "openPickup", orders });
              });
            }
          }
        } else {
          await new Promise((r) => setTimeout(r, 1e3));
        }
      });
      RegisterCommand("shop", async () => {
        const playerPed = PlayerPedId();
        const coords = GetEntityCoords(playerPed, true);
        clearTablet();
        const animDict = "amb@world_human_seat_wall_tablet@female@base";
        const modelHash = GetHashKey("prop_cs_tablet");
        RequestAnimDict(animDict);
        while (!HasAnimDictLoaded(animDict)) await new Promise((r) => setTimeout(r, 10));
        RequestModel(modelHash);
        while (!HasModelLoaded(modelHash)) await new Promise((r) => setTimeout(r, 10));
        tabletProp = CreateObject(modelHash, coords[0], coords[1], coords[2], true, true, false);
        const boneIndex = GetPedBoneIndex(playerPed, 28422);
        AttachEntityToEntity(tabletProp, playerPed, boneIndex, 0, 0, 0.03, 0, 0, 0, true, true, false, true, 1, true);
        TaskPlayAnim(playerPed, animDict, "base", 8, -8, -1, 50, 0, false, false, false);
        SetNuiFocus(true, true);
        SendNUIMessage({
          action: "open",
          items: Config.Items
        });
      }, false);
      RegisterNuiCallback("claim", (data, cb) => {
        TriggerServerEvent("armersohn:claimItems", data.items);
        cb("ok");
      });
      RegisterNuiCallback("checkout", (data, cb) => {
        TriggerServerEvent("armersohn:finalCheckout", data.items, data.delivery);
        cb("ok");
      });
      RegisterNuiCallback("purchase", (data, cb) => {
        TriggerServerEvent("armersohn:purchase", data);
        cb("ok");
      });
      RegisterNuiCallback("close", (data, cb) => {
        SetNuiFocus(false, false);
        try {
          clearTablet();
        } catch (e) {
          console.log(e);
        }
        cb("ok");
      });
      onNet("armersohn:spawnVehicle", async (model, plate, color, isDelivery) => {
        const hash = GetHashKey(model);
        RequestModel(hash);
        while (!HasModelLoaded(hash)) await new Promise((r) => setTimeout(r, 10));
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
        SetVehicleNumberPlateText(veh, (plate == null ? void 0 : plate.toUpperCase()) || "ARMER");
        if (color) {
          SetVehicleCustomPrimaryColour(veh, color.r, color.g, color.b);
          SetVehicleCustomSecondaryColour(veh, color.r, color.g, color.b);
        }
        TaskWarpPedIntoVehicle(p, veh, -1);
      });
    }
  });
  require_client();
})();
//# sourceMappingURL=client.js.map
