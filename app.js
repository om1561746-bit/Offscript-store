
const SUPABASE_URL = "https://vsaakjlblpyewjohravi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HQULCRRENKLYll-lslrR-Q_I3qa_NMg";

let products = [];
let cart = JSON.parse(localStorage.getItem("offspcript-cart") || "[]");
let activeFilter = "all";

const $ = id => document.getElementById(id);
const money = n => "EGP " + Number(n).toLocaleString("en-EG");

function save() {
  localStorage.setItem("offspcript-cart", JSON.stringify(cart));
  renderCart();
}

async function loadProducts() {
  const list = $("products");
  list.innerHTML = '<p class="muted">Loading products...</p>';

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=name,price,description,image_url,color,size,status,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

    products = data.map((p, index) => ({
      id: `${p.name}-${p.color || ""}-${p.size || ""}-${p.created_at || index}`,
      name: p.name,
      price: Number(p.price),
      description: p.description || "",
      image: p.image_url || "",
      color: p.color || "",
      sizes: String(p.size || "One Size").split(",").map(s => s.trim()),
      status: String(p.status || "Available").toLowerCase().trim()
    }));

    renderProducts();

  } catch (error) {
    console.error(error);
    list.innerHTML =
      '<p class="muted">Could not load products. Please refresh the page.</p>';
  }
}

function getStatus(status) {
  const value = status.replace(/[\s_-]/g, "");
  if (value === "soldout") return "SOLD OUT";
  if (value === "comingsoon") return "COMING SOON";
  return "AVAILABLE";
}

function renderProducts() {
  const list = $("products");
  list.innerHTML = "";

  const visibleProducts = products.filter(p =>
    activeFilter === "all" || !p.category || p.category === activeFilter
  );

  if (!visibleProducts.length) {
    list.innerHTML = '<p class="muted">No products available.</p>';
    return;
  }

  visibleProducts.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";

    const status = getStatus(p.status);
    const available = status === "AVAILABLE";

    const image = p.image
      ? `<img src="${p.image}" alt="${p.name}">`
      : `<div class="placeholder-art">OFF<br>SPC<br>RIPT</div>`;

    card.innerHTML = `
      <div class="product-image">
        ${image}
        <span class="product-tag">${status}</span>
      </div>
      <div class="product-info">
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-meta">
            ${p.description}
            ${p.color ? `<br>Color: ${p.color}` : ""}
            ${p.sizes.length ? `<br>Size: ${p.sizes.join(", ")}` : ""}
          </div>
          <div class="product-price">${money(p.price)}</div>
        </div>
        <button class="add-button" ${available ? "" : "disabled"}>
          ${available ? "ADD +" : status}
        </button>
      </div>`;

    if (available) {
      card.querySelector("button").onclick = () => add(p.id);
    } else {
      card.querySelector("button").style.opacity = "0.5";
      card.querySelector("button").style.cursor = "not-allowed";
    }

    list.appendChild(card);
  });
}

function add(id) {
  const p = products.find(x => x.id === id);
  if (!p || getStatus(p.status) !== "AVAILABLE") return;

  const firstSize = p.sizes[0] || "One Size";
  const existing = cart.find(x => x.id === id && x.size === firstSize);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      size: firstSize,
      qty: 1
    });
  }

  save();
  openCart();
}

function renderCart() {
  const count = cart.reduce((s, x) => s + x.qty, 0);
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

  $("cartCount").textContent = count;
  $("drawerCount").textContent = `(${count})`;
  $("subtotal").textContent = money(total);
  $("checkoutTotal").textContent = money(total);

  const wrap = $("cartItems");

  if (!cart.length) {
    wrap.innerHTML = '<p class="muted">Your bag is empty.</p>';
    return;
  }

  wrap.innerHTML = "";

  cart.forEach((x, i) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    row.innerHTML = `
      <div>
        <strong>${x.name}</strong>
        <small>Size: ${x.size} · ${money(x.price)}</small>
        <small>${money(x.price * x.qty)}</small>
      </div>
      <div class="qty">
        <button aria-label="Decrease">−</button>
        <span>${x.qty}</span>
        <button aria-label="Increase">+</button>
      </div>`;

    const buttons = row.querySelectorAll("button");

    buttons[0].onclick = () => {
      x.qty--;
      if (x.qty <= 0) cart.splice(i, 1);
      save();
    };

    buttons[1].onclick = () => {
      x.qty++;
      save();
    };

    wrap.appendChild(row);
  });
}

function openCart() {
  $("overlay").classList.add("show");
  $("cartDrawer").classList.add("show");
}

function closeAll() {
  $("overlay").classList.remove("show");
  $("cartDrawer").classList.remove("show");
  $("checkoutModal").classList.remove("show");
}

$("openCart").onclick = openCart;
$("closeCart").onclick = closeAll;
$("overlay").onclick = closeAll;

$("checkoutButton").onclick = () => {
  if (!cart.length) return;
  closeAll();
  $("checkoutModal").classList.add("show");
};

$("closeCheckout").onclick = () =>
  $("checkoutModal").classList.remove("show");

document.querySelectorAll(".filter").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".filter").forEach(x =>
      x.classList.remove("active")
    );
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderProducts();
  };
});

$("checkoutForm").onsubmit = async event => {
  event.preventDefault();
  if (!cart.length) return;

  const form = event.target;
  const data = Object.fromEntries(new FormData(form).entries());

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  const reference = "OFF-" + Date.now().toString().slice(-7);

  const orderData = {
    order_reference: reference,
    customer_name: data.name,
    phone: data.phone,
    email: data.email || null,
    address: data.address,
    items: cart,
    total,
    payment_method: "Cash on Delivery",
    status: "Pending",
    notes: data.notes || null
  };

  const msg = $("formMessage");
  msg.className = "form-message";
  msg.textContent = "Saving your order...";

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) throw new Error(await response.text());

    msg.className = "form-message success";
    msg.textContent =
      "Order saved successfully! Your order reference is " + reference;

    cart = [];
    save();
    form.reset();

  } catch (error) {
    console.error(error);
    msg.className = "form-message error";
    msg.textContent = "Could not save your order. Please try again.";
  }
};

const trackButton = $("trackButton");

if (trackButton) {
  trackButton.addEventListener("click", async () => {
    const orderReference = $("trackReference").value.trim();
    const phone = $("trackPhone").value.trim();
    const result = $("trackResult");

    if (!orderReference || !phone) {
      result.textContent =
        "Please enter your order reference and phone number.";
      return;
    }

    result.textContent = "Checking order...";

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/track-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            order_reference: orderReference,
            phone
          })
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        result.textContent = data.error || "Could not find order.";
        return;
      }

      result.textContent =
        `Order ${data.order_reference}: ${data.status}`;

    } catch {
      result.textContent =
        "Could not check your order. Please try again.";
    }
  });
}

renderCart();
loadProducts();
