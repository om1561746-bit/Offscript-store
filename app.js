
const SUPABASE_URL = "https://vsaakjlblpyewjohravi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HQULCRRENKLYll-lslrR-Q_I3qa_NMg";

let products = [];
let cart = JSON.parse(localStorage.getItem("offspcript-cart") || "[]");
let activeFilter = "all";

const $ = id => document.getElementById(id);
const money = n => "EGP " + Number(n || 0).toLocaleString("en-EG");

function save() {
  localStorage.setItem("offspcript-cart", JSON.stringify(cart));
  renderCart();
}

function getStatus(status) {
  const value = String(status || "available").toLowerCase().replace(/[\s_-]/g, "");
  if (value === "soldout") return "SOLD OUT";
  if (value === "comingsoon") return "COMING SOON";
  return "AVAILABLE";
}

async function loadProducts() {
  const list = $("products");
  if (!list) return;

  list.innerHTML = '<p class="muted">Loading products...</p>';

  try {
    const response = await fetch(
     `${SUPABASE_URL}/rest/v1/products?select=id,name,category,description,price,image_url,sizes,colors,status,created_at&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        }
      }
    );

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();

  products = data.map(p => ({
  id: String(p.id),
  name: p.name || "",
  category: p.category || "tshirt",
  price: Number(p.price || 0),
  description: p.description || "",
  image: p.image_url || "",
  colors: Array.isArray(p.colors) ? p.colors : [],
  sizes: Array.isArray(p.sizes) ? p.sizes : [],
  status: p.status || "available"
}));

    renderProducts();

  } catch (error) {
    console.error("Products loading error:", error);
    list.textContent = "Could not load products. Please refresh the page.";
  }
}

function renderProducts() {
  const list = $("products");
  if (!list) return;

  list.innerHTML = "";

  const visibleProducts = products.filter(p =>
    activeFilter === "all" ||
p.category === activeFilter
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

    const imageArea = document.createElement("div");
    imageArea.className = "product-image";

    if (p.image) {
      const img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      img.onerror = () => {
        img.remove();
        imageArea.insertAdjacentHTML(
          "afterbegin",
          '<div class="placeholder-art">OFF<br>SPC<br>RIPT</div>'
        );
      };
      imageArea.appendChild(img);
    } else {
      imageArea.innerHTML =
        '<div class="placeholder-art">OFF<br>SPC<br>RIPT</div>';
    }

    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = status;
    imageArea.appendChild(tag);

    const info = document.createElement("div");
    info.className = "product-info";

    const details = document.createElement("div");

    const name = document.createElement("div");
    name.className = "product-name";
    name.textContent = p.name;

    const meta = document.createElement("div");
    meta.className = "product-meta";
    meta.textContent = [
      p.description,
      p.colors.length ? "Colors: " + p.colors.join(", ") : "",
      p.sizes.length ? "Sizes: " + p.sizes.join(", ") : ""
    ].filter(Boolean).join("\n");

    const price = document.createElement("div");
    price.className = "product-price";
    price.textContent = money(p.price);

    details.append(name, meta, price);

    const button = document.createElement("button");
    button.className = "add-button";
    button.textContent = available ? "ADD +" : status;
    button.disabled = !available;

    if (available) {
      button.onclick = () => add(p.id);
    } else {
      button.style.opacity = "0.5";
      button.style.cursor = "not-allowed";
    }

    info.append(details, button);
    card.append(imageArea, info);
    list.appendChild(card);
  });
}

function add(id, selectedSize) {
  const p = products.find(x => x.id === String(id));
  if (!p || getStatus(p.status) !== "AVAILABLE") return;

  if (!selectedSize) {
    alert("Please select a size first.");
    return;
  }

  const existing = cart.find(
    x => String(x.id) === String(id) && x.size === selectedSize
  );

  if (existing) {
    existing.qty++;
  } else {
 
    const details = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = x.name;

    const size = document.createElement("small");
    size.textContent = `Size: ${x.size} · ${money(x.price)}`;

    const lineTotal = document.createElement("small");
    lineTotal.textContent = money(x.price * x.qty);
cart.push

  wrap.innerHTML = "";

  cart.forEach((x, i) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    details.append(name, size, lineTotal);

    const qty = document.createElement("div");
    qty.className = "qty";

    const decrease = document.createElement("button");
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", "Decrease");

    const number = document.createElement("span");
    number.textContent = x.qty;

    const increase = document.createElement("button");
    increase.textContent = "+";
    increase.setAttribute("aria-label", "Increase");

    decrease.onclick = () => {
      x.qty--;
      if (x.qty <= 0) cart.splice(i, 1);
      save();
    };

    increase.onclick = () => {
      x.qty++;
      save();
    };

    qty.append(decrease, number, increase);
    row.append(details, qty);
    wrap.appendChild(row);
  });
}

function openCart() {
  $("overlay")?.classList.add("show");
  $("cartDrawer")?.classList.add("show");
}

function closeAll() {
  $("overlay")?.classList.remove("show");
  $("cartDrawer")?.classList.remove("show");
  $("checkoutModal")?.classList.remove("show");
}

if ($("openCart")) $("openCart").onclick = openCart;
if ($("closeCart")) $("closeCart").onclick = closeAll;
if ($("overlay")) $("overlay").onclick = closeAll;

if ($("checkoutButton")) {
  $("checkoutButton").onclick = () => {
    if (!cart.length) return;
    closeAll();
    $("checkoutModal")?.classList.add("show");
  };
}

if ($("closeCheckout")) {
  $("closeCheckout").onclick = () =>
    $("checkoutModal")?.classList.remove("show");
}

document.querySelectorAll(".filter").forEach(button => {
  button.onclick = () => {
    document.querySelectorAll(".filter").forEach(x =>
      x.classList.remove("active")
    );

    button.classList.add("active");
    activeFilter = button.dataset.filter || "all";
    renderProducts();
  };
});

if ($("checkoutForm")) {
  $("checkoutForm").onsubmit = async event => {
    event.preventDefault();
    if (!cart.length) return;

    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());

    const total = cart.reduce(
      (s, x) => s + x.price * x.qty,
      0
    );

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
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
            Prefer: "return=minimal"
          },
          body: JSON.stringify(orderData)
        }
      );

      if (!response.ok) throw new Error(await response.text());

      msg.className = "form-message success";
      msg.textContent =
        "Order saved successfully! Your order reference is " + reference;

      cart = [];
      save();
      form.reset();

    } catch (error) {
      console.error("Order error:", error);
      msg.className = "form-message error";
      msg.textContent = "Could not save your order. Please try again.";
    }
  };
}

const trackButton = $("trackButton");

if (trackButton) {
  trackButton.addEventListener("click", async () => {
    const orderReference = $("trackReference")?.value.trim();
    const phone = $("trackPhone")?.value.trim();
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

    } catch (error) {
      console.error("Tracking error:", error);
      result.textContent =
        "Could not check your order. Please try again.";
    }
  });
}

renderCart();
loadProducts();
