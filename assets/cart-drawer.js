function openCartDrawer() {
  document.querySelector(".cart-drawer").classList.add("cart-drawer--active");
}

function closeCartDrawer() {
  document
    .querySelector(".cart-drawer")
    .classList.remove("cart-drawer--active");
}

function updateCartItemCounts(count) {
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
  });
}

async function updateCartDrawer() {
  const res = await fetch("/?section_id=cart-drawer");
  const text = await res.text();
  const html = document.createElement("div");
  html.innerHTML = text;

  const newBox = html.querySelector(".cart-drawer").innerHTML;

  document.querySelector(".cart-drawer").innerHTML = newBox;

  addCartDrawerListeners();
  
  // Update free delivery progress bar animation
  if (window.updateFreeDeliveryProgress) {
    window.updateFreeDeliveryProgress();
  }
}

// Debounce object to store timeouts for each line item
const quantityUpdateTimeouts = {};

function addCartDrawerListeners() {
  // Update quantities
  document
    .querySelectorAll(".cart-drawer-quantity-selector button")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        // Get line item key
        const rootItem =
          button.parentElement.parentElement.parentElement.parentElement
            .parentElement;
        const key = rootItem.getAttribute("data-line-item-key");

        // Get new quantity
        const currentQuantity = Number(
          button.parentElement.querySelector("input").value
        );
        const isUp = button.classList.contains(
          "cart-drawer-quantity-selector-plus"
        );
        const newQuantity = isUp ? currentQuantity + 1 : currentQuantity - 1;

        // Update the input display immediately for better UX
        button.parentElement.querySelector("input").value = newQuantity;

        // Clear any existing timeout for this item
        if (quantityUpdateTimeouts[key]) {
          clearTimeout(quantityUpdateTimeouts[key]);
        }

        // Set a new timeout for this item
        quantityUpdateTimeouts[key] = setTimeout(async () => {
          // Ajax update
          const res = await fetch("/cart/update.js", {
            method: "post",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ updates: { [key]: newQuantity } }),
          });
          const cart = await res.json();

          updateCartItemCounts(cart.item_count);

          // Update cart
          updateCartDrawer();

          // Clear the timeout reference
          delete quantityUpdateTimeouts[key];
        }, 300); // 300ms delay
      });
    });

  document.querySelector(".cart-drawer-box").addEventListener("click", (e) => {
    e.stopPropagation();
  });

  document
    .querySelectorAll(".cart-drawer-header-right-close, .cart-drawer")
    .forEach((el) => {
      el.addEventListener("click", () => {
        closeCartDrawer();
      });
    });
}

addCartDrawerListeners();

document.querySelectorAll('form[action="/cart/add"]').forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Submit form with ajax
    await fetch("/cart/add", {
      method: "post",
      body: new FormData(form),
    });

    // Get cart count
    const res = await fetch("/cart.js");
    const cart = await res.json();
    updateCartItemCounts(cart.item_count);

    // Update cart
    await updateCartDrawer();

    // Open cart drawer
    openCartDrawer();
    
    // Update free delivery progress bar
    if (window.updateFreeDeliveryProgress) {
      window.updateFreeDeliveryProgress();
    }
  });
});

document.querySelectorAll('a[href="/cart"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    openCartDrawer();
  });
}); 