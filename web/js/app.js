const resourceName = 'shop'; 

let cart = [];
let currentCategory = 'items';
let deliveryMode = false;
// NEU: Hier landen die Items aus dem Shared-Config
let shopItems = []; 

document.onkeyup = function(data) {
    if (data.which == 27) {
        closePlate();
        closeShop();
    }
};

window.addEventListener('message', (e) => {
    if (e.data.action === "open") {
        // NEU: Daten empfangen
        shopItems = e.data.items || [];
        
        document.getElementById('shop-main').style.display = 'flex';
        document.getElementById('pickup-main').style.display = 'none';
        document.body.style.display = 'flex';
        render();
        setTimeout(() => { document.body.classList.add('visible'); }, 50);

    } else if (e.data.action === "openPickup") {
        document.getElementById('shop-main').style.display = 'none';
        document.getElementById('pickup-main').style.display = 'flex';
        document.body.style.display = 'flex';
        setTimeout(() => document.body.classList.add('visible'), 50);
        
        const list = document.getElementById('order-list'); 
        list.innerHTML = '';
        
        if (!e.data.orders || e.data.orders.length === 0) {
            list.innerHTML = '<div class="col-12 text-center mt-5 text-muted">Keine Waren im Lager.</div>';
        } else {
            e.data.orders.forEach((o) => {
                const isCar = o.category === 'cars';
                
                list.innerHTML += `
                <div class="item-card col-12" style="--dynamic-col: #a29bfe; --dynamic-glow: rgba(162,155,254,0.4); display: flex; flex-direction: row; align-items: center; justify-content: space-between; padding: 15px 20px;">
                    
                    <div class="d-flex align-items-center gap-3">
                        <input type="checkbox" class="claim-checkbox" 
                               data-id="${o.id}" 
                               onchange="toggleInput(${o.id})">
                        
                        <div class="d-flex flex-column">
                            <span style="font-size: 1.1rem; font-weight: 700; color: #fff;">${o.label}</span>
                            <span class="text-muted" style="font-size: 0.85rem;">Verfügbar: <span id="max-${o.id}" style="color: #00b894; font-weight: bold; margin-right: 4px;">${o.qty}</span>x</span>
                        </div>
                    </div>

                    ${!isCar ? `
                        <input type="number" id="qty-claim-${o.id}" 
                               class="form-control text-center claim-input" 
                               value="${o.qty}" min="1" max="${o.qty}" 
                               disabled
                               style="width: 70px; height: 40px; margin: 0; opacity: 0.3; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3);">
                    ` : '<span class="badge bg-secondary" style="padding: 10px;">Fahrzeug</span>'}
                </div>`;
            });
        }
    }
});

function toggleInput(id) {
    const checkbox = document.querySelector(`.claim-checkbox[data-id="${id}"]`);
    const input = document.getElementById(`qty-claim-${id}`);
    
    if (input) {
        input.disabled = !checkbox.checked;
        input.style.opacity = checkbox.checked ? "1" : "0.3";
    }
}

function claimSelected() {
    const selectedItems = [];
    const checkboxes = document.querySelectorAll('.claim-checkbox:checked');

    if (checkboxes.length === 0) return; 

    checkboxes.forEach(box => {
        const id = box.getAttribute('data-id');
        const maxQty = parseInt(document.getElementById(`max-${id}`).innerText);
        const input = document.getElementById(`qty-claim-${id}`);
        
        let qty = 1;
        if (input) {
            qty = parseInt(input.value);
            if (isNaN(qty) || qty < 1) qty = 1;
            if (qty > maxQty) qty = maxQty;
        }

        selectedItems.push({ id: parseInt(id), qty: qty });
    });

    fetch(`https://${resourceName}/claim`, { 
        method: 'POST', 
        body: JSON.stringify({ items: selectedItems }) 
    }); 
    
    closeShop();
}

function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('tab-' + cat).classList.add('active');
    
    const titles = { 'items': 'MARKT', 'weapons': 'WAFFEN', 'cars': 'FAHRZEUGHANDEL', 'cart': 'WARENKORB' };
    document.getElementById('category-title').innerText = titles[cat] || cat;
    render();
}

function render() {
    const grid = document.getElementById('item-grid');
    const summary = document.getElementById('cart-summary');
    grid.innerHTML = '';
    summary.style.display = (currentCategory === 'cart' && cart.length > 0) ? 'flex' : 'none';

    if (currentCategory === 'cart') {
        if (!cart.length) { grid.innerHTML = '<div class="col-12 text-center mt-5 text-muted">Dein Warenkorb ist leer.</div>'; return; }
        let total = 0;
        cart.forEach((it, idx) => {
            total += it.price * it.qty;
            grid.innerHTML += `
            <div class="item-card col-12" style="--dynamic-col: #a29bfe;">
                <div class="d-flex justify-content-between align-items-center">
                    <div><b>${it.label}</b><br><small class="text-muted">${it.qty}x á ${it.price}$</small></div>
                    <button class="btn-remove" onclick="removeFromCart(${idx})"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
        });
        document.getElementById('total-price').innerText = total + '$';
        return;
    }

    
    shopItems.filter(i => i.category === currentCategory).forEach(item => {
        const isCar = item.category === 'cars';
        let colorVar = '#a29bfe';
        if(item.category === 'items') colorVar = 'var(--col-items)';
        if(item.category === 'weapons') colorVar = 'var(--col-weapons)';
        if(item.category === 'cars') colorVar = 'var(--col-cars)';
        
        grid.innerHTML += `
        <div class="item-card" style="--dynamic-col: ${colorVar}; --dynamic-glow: ${colorVar}40;">
            <div class="item-icon-box"><i class="${item.icon}"></i></div>
            <div class="d-flex justify-content-between align-items-start">
                <div><h6 class="mb-0 fw-bold">${item.label}</h6><span class="item-price">${item.price}$</span></div>
                ${!isCar ? `<input type="number" id="qty-${item.item}" value="1" min="1" style="width:50px; margin:0; padding:2px;">` : ''}
            </div>
            ${isCar ? `
            <div class="car-stats">
                <div class="stat-label d-flex justify-content-between">GESCHWINDIGKEIT <span>${item.stats.speed}%</span></div>
                <div class="stat-bar mb-2"><div class="stat-fill" style="width:${item.stats.speed}%"></div></div>
                <div class="stat-label d-flex justify-content-between">HANDLING <span>${item.stats.handling}%</span></div>
                <div class="stat-bar"><div class="stat-fill" style="width:${item.stats.handling}%"></div></div>
            </div>` : ''}
            <div class="d-flex gap-2 mt-3" style="margin-top: auto !important;">
                <button class="btn-buy flex-grow-1" onclick="addToCart('${item.item}')">IN DEN WARENKORB</button>
            </div>
        </div>`;
    });
}

function addToCart(name) {
    
    const item = shopItems.find(i => i.item === name);
    const itemCopy = JSON.parse(JSON.stringify(item));
    const qtyInput = document.getElementById(`qty-${name}`);
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;
    
    if (itemCopy.category === 'cars') {
        itemCopy.qty = 1;
        cart.push(itemCopy);
    } else {
        const inCart = cart.find(c => c.item === name);
        if (inCart) inCart.qty += qty; else { itemCopy.qty = qty; cart.push(itemCopy); }
    }
    updateBadge();
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "HINZUGEFÜGT ✔";
    setTimeout(() => { btn.innerText = originalText; }, 1000);
}

function updateBadge() {
    const b = document.getElementById('cart-badge');
    b.innerText = cart.length;
    b.style.display = cart.length ? 'inline-block' : 'none';
}

function removeFromCart(idx) { cart.splice(idx,1); updateBadge(); render(); }

function openCheckout() {
    const carList = document.getElementById('dynamic-car-list');
    carList.innerHTML = '';
    let hasCars = false;

    cart.forEach((item, index) => {
        if (item.category === 'cars') {
            hasCars = true;
            carList.innerHTML += `
                <div class="mb-3 p-3" style="background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                    <div class="fw-bold mb-2 text-white">${item.label}</div>
                    <input type="text" id="plate-${index}" class="form-control mb-2" placeholder="KENNZEICHEN (MAX 8)" maxlength="8" value="ARMER">
                    <div class="d-flex align-items-center justify-content-between">
                        <small class="text-muted">Lackierung wählen:</small>
                        <input type="color" id="color-${index}" value="#a29bfe" class="form-control form-control-color" style="width: 50px; margin: 0;">
                    </div>
                </div>
            `;
        }
    });

    document.getElementById('car-fields').style.display = hasCars ? 'block' : 'none';
    document.getElementById('plate-overlay').style.display = 'flex';
}

function confirmFinalPurchase() {
    cart.forEach((item, index) => {
        if (item.category === 'cars') {
            const plateInput = document.getElementById(`plate-${index}`);
            const colorInput = document.getElementById(`color-${index}`);
            if (plateInput && colorInput) {
                item.plate = plateInput.value.toUpperCase() || "ARMER";
                item.color = hexToRgb(colorInput.value);
            }
        }
    });
    fetch(`https://${resourceName}/checkout`, { 
        method: 'POST', 
        body: JSON.stringify({ items: cart, delivery: deliveryMode }) 
    });
    cart = []; updateBadge();
    closePlate(); closeShop();
}

function setDelivery(val) {
    deliveryMode = val;
    document.getElementById('opt-delivery').classList.toggle('active', val);
    document.getElementById('opt-pickup').classList.toggle('active', !val);
}

function hexToRgb(hex) {
    if (!hex) return {r:0, g:0, b:0};
    var r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return {r,g,b};
}

function closePlate() { document.getElementById('plate-overlay').style.display = 'none'; }

function closeShop() { 
    document.body.classList.remove('visible'); 
    setTimeout(() => { 
        document.body.style.display = 'none'; 
        fetch(`https://${resourceName}/close`, {method:'POST'}); 
    }, 300); 
}