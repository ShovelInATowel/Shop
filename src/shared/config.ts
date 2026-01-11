interface ShopItem {
    label: string;
    item: string;
    price: number;
    icon: string;
    category: 'items' | 'weapons' | 'cars';
    stats?: { speed: number; handling: number };
}

interface ShopConfig {
    PickupLocation: { x: number; y: number; z: number };
    Blip: {
        Sprite: number;
        Color: number;
        Scale: number;
        Label: string;
    };
    Items: ShopItem[];
}

export const Config: ShopConfig = {
    // Koordinaten der Packstation / Lager
    PickupLocation: { x: 1704.25, y: 3265.0, z: 41.14 },
    
    Blip: {
        Sprite: 478,
        Color: 5,
        Scale: 0.8,
        Label: "Armersohn Packstation"
    },

    Items: [
        { label: "Flasche Wasser", item: "water", price: 4, icon: "fas fa-bottle-water", category: "items" },
        { label: "Stück Brot", item: "bread", price: 2, icon: "fas fa-bread-slice", category: "items" },
        { label: "Modernes Lungenbrötchen", item: "vape", price: 5, icon: "fas fa-smog", category: "items" },
        { label: "Verbandskasten", item: "medikit", price: 10, icon: "fas fa-first-aid", category: "items" },
        
        { label: "Pistole", item: "WEAPON_PISTOL", price: 1000, icon: "fas fa-gun", category: "weapons" },
        { label: "Messer", item: "WEAPON_KNIFE", price: 150, icon: "fas fa-utensils", category: "weapons" },
        
        { label: "Arschkarre", item: "tailgater", price: 1, icon: "fas fa-car", category: "cars", stats: { speed: 65, handling: 45 } },
        { label: "Cards Senti", item: "sentinel3", price: 2, icon: "fas fa-car-side", category: "cars", stats: { speed: 82, handling: 60 } },
        { label: "Bati", item: "bati", price: 3, icon: "fas fa-motorcycle", category: "cars", stats: { speed: 95, handling: 85 } }
    ]
};