import "reflect-metadata";
import { DataSource } from "typeorm";
import { Order } from "./entity/order"; 
import { Config } from "../shared/config";


const ESX = global.exports["es_extended"].getSharedObject();


const AppDataSource = new DataSource({
    type: "mysql",
    host: "127.0.0.1",
    port: 3306,
    username: "root",
    password: "",
    database: "ESXLegacy_616974", 
    synchronize: false,           
    logging: false,               
    entities: [Order],
    subscribers: [],
    migrations: [],
});

let orderRepo: any = null;

AppDataSource.initialize()
    .then(() => {
        // Nur eine kurze Bestätigung beim Start für mich beim Probieren
        console.log(" Shop bereit.");
        orderRepo = AppDataSource.getRepository(Order);
    })
    .catch((error) => console.log(" DB Fehler: ", error));




const itemPrices: { [key: string]: number } = {};
Config.Items.forEach(i => itemPrices[i.item] = i.price);

async function processOrder(src: number, items: any[], delivery: boolean) {
    if (!orderRepo) return;

    const xPlayer = ESX.GetPlayerFromId(src);
    if (!xPlayer) return;

    let totalBill = 0;
    
    items.forEach((item: any) => {
        let price = itemPrices[item.item] || 999999; 
        if (delivery) price = Math.round(price * 1.1);
        totalBill += (price * (item.category === 'cars' ? 1 : (item.qty || 1)));
    });

    if (xPlayer.getMoney() >= totalBill) {
        xPlayer.removeMoney(totalBill);
        
        if (delivery) {
            // LIEFERUNG
            items.forEach((item: any) => {
                if (item.category === "cars") {
                    TriggerClientEvent("armersohn:spawnVehicle", src, item.item, item.plate, item.color, true);
                } else if (item.item.startsWith("WEAPON_")) {
                    xPlayer.addWeapon(item.item, 255);
                } else {
                    xPlayer.addInventoryItem(item.item, item.qty || 1);
                }
            });
            TriggerClientEvent("esx:showNotification", src, `~g~Bestellung erhalten! ~s~-${totalBill}$`);
        } else {
            // LAGERUNG
            const identifier = xPlayer.getIdentifier();

            for (const item of items) {
                const qty = item.category === 'cars' ? 1 : (item.qty || 1);

                if (item.category === 'cars') {
                    const newOrder = new Order();
                    newOrder.identifier = identifier;
                    newOrder.item = item.item;
                    newOrder.label = item.label;
                    newOrder.qty = 1;
                    newOrder.category = 'cars';
                    newOrder.plate = item.plate;
                    newOrder.color = JSON.stringify(item.color);
                    
                    await orderRepo.save(newOrder);
                    continue;
                }

                const existingOrder = await orderRepo.findOne({
                    where: { 
                        identifier: identifier, 
                        item: item.item 
                    }
                });

                if (existingOrder && existingOrder.category !== 'cars') {
                    existingOrder.qty += qty;
                    await orderRepo.save(existingOrder);
                } else {
                    const newOrder = new Order();
                    newOrder.identifier = identifier;
                    newOrder.item = item.item;
                    newOrder.label = item.label;
                    newOrder.qty = qty;
                    newOrder.category = item.category || "items";
                    newOrder.plate = null;
                    newOrder.color = null;

                    await orderRepo.save(newOrder);
                }
            }
            TriggerClientEvent("esx:showNotification", src, `~y~Paket im Lager! ~s~-${totalBill}$`);
        }
    } else {
        TriggerClientEvent("esx:showNotification", src, "~r~Nicht genug Geld!");
    }
}

ESX.RegisterServerCallback("armersohn:getOrders", async (src: number, cb: Function) => {
    if (!orderRepo) return cb([]);
    
    const xPlayer = ESX.GetPlayerFromId(src);
    const identifier = xPlayer.getIdentifier();
    
    try {
        const orders = await orderRepo.find({
            where: { identifier: identifier }
        });
        cb(orders);
    } catch (err) {
        cb([]);
    }
});

RegisterNetEvent("armersohn:claimItems");
on("armersohn:claimItems", async (claimList: any[]) => {
    if (!orderRepo) return;

    const src = (global as any).source;
    const xPlayer = ESX.GetPlayerFromId(src);
    
    const playerCoords = xPlayer.getCoords(true);
    const dist = Math.sqrt(
        Math.pow(playerCoords.x - Config.PickupLocation.x, 2) +
        Math.pow(playerCoords.y - Config.PickupLocation.y, 2) +
        Math.pow(playerCoords.z - Config.PickupLocation.z, 2)
    );

    if (dist > 20.0) {
        TriggerClientEvent("esx:showNotification", src, "~r~Du bist zu weit weg!");
        return;
    }

    const identifier = xPlayer.getIdentifier();
    let count = 0;

    for (const claim of claimList) {
        const order = await orderRepo.findOneBy({ id: claim.id });
        
        if (order && order.identifier === identifier) {
            
            let amountToGive = claim.qty;
            if (amountToGive > order.qty) amountToGive = order.qty;
            if (amountToGive <= 0) amountToGive = 1;

            let success = false;

            if (order.category === "cars") {
                let colorObj = order.color ? JSON.parse(order.color) : null;
                TriggerClientEvent("armersohn:spawnVehicle", src, order.item, order.plate, colorObj, false);
                await orderRepo.remove(order);
                success = true;

            } else if (order.item.startsWith("WEAPON_")) {
                xPlayer.addWeapon(order.item, 255);
                
                if (amountToGive >= order.qty) {
                     await orderRepo.remove(order);
                } else {
                     order.qty -= amountToGive;
                     await orderRepo.save(order);
                }
                success = true;

            } else {
                if (xPlayer.canCarryItem(order.item, amountToGive)) {
                    xPlayer.addInventoryItem(order.item, amountToGive);
                    
                    if (amountToGive >= order.qty) {
                        await orderRepo.remove(order);
                    } else {
                        order.qty -= amountToGive;
                        await orderRepo.save(order);
                    }
                    success = true;
                } else {
                     TriggerClientEvent("esx:showNotification", src, `~r~Tasche voll für ${order.label}!`);
                }
            }
            if(success) count++;
        }
    }

    if (count > 0) {
        TriggerClientEvent("esx:showNotification", src, `~g~${count} Positionen abgeholt.`);
    }
});

RegisterNetEvent("armersohn:finalCheckout");
on("armersohn:finalCheckout", (items: any, delivery: boolean) => processOrder((global as any).source, items, delivery));

RegisterNetEvent("armersohn:purchase");
on("armersohn:purchase", (data: any) => processOrder((global as any).source, [{ item: data.item, label: data.label, qty: data.qty, category: data.category, plate: data.plate, color: data.color }], data.delivery));