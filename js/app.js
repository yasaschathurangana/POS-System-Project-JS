const categories = ["Burgers", "Fries", "Drinks"];
const originalHero = document.getElementById("feature").innerHTML;

let products = [
    {
        id: "classic",
        name: "Classic Cheeseburger",
        category: "Burgers",
        price: 125000,
        photo: "classic"
    },
    {
        id: "fries",
        name: "Golden Fries",
        category: "Fries",
        price: 45000,
        photo: "fries"
    },
    {
        id: "cola",
        name: "Ice Cold Cola",
        category: "Drinks",
        price: 30000,
        photo: "cola"
    },
    {
        id: "double",
        name: "Double Feature Burger",
        category: "Burgers",
        price: 165000,
        photo: "double"
    },
    {
        id: "chicken",
        name: "Crispy Chicken Burger",
        category: "Burgers",
        price: 110000,
        photo: "chicken"
    },
    {
        id: "shake",
        name: "Chocolate Shake",
        category: "Drinks",
        price: 65000,
        photo: "shake"
    }
];

let customers = [];
let orders = [];

let cart = {
    lines: [],
    buyer: "",
    editing: null
};

let parkedCart = null;
let nextOrderNumber = 1;

let currentPage = "Counter";
let currentFilter = "All";

let timer;
let modalMode = "";
let selectedRecord = null;
let selectedType = "";
let billHTML = "";
let selectedImage = "";


// 2. Basic Functions

function money(amount) {

    return "Rs. " + (amount / 100).toLocaleString("en-LK");
}


function escapeHTML(value) {

    let element = document.createElement("span");

    element.textContent = String(value);

    return element.innerHTML
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


function findRecord(records, id) {

    for (let i = 0; i < records.length; i++) {

        if (String(records[i].id) === String(id)) {

            return records[i];
        }
    }

    return null;
}


function calculateTotal(lines) {

    let total = 0;

    for (let i = 0; i < lines.length; i++) {

        total = total + lines[i].price * lines[i].qty;
    }

    return total;
}


function getCustomerName(id) {

    for (let i = 0; i < customers.length; i++) {

        if (customers[i].id === id) {

            return customers[i].name;
        }
    }

    return "Walk-in customer";
}


function showMessage(message) {

    document.getElementById("notice").textContent = message;

    clearTimeout(timer);

    timer = setTimeout(function () {

        document.getElementById("notice").textContent = "";

    }, 4000);
}


// 3. Page Navigation

function btnPageOnAction(page) {

    currentPage = page;

    let buttons = document.querySelectorAll("nav button");

    for (let i = 0; i < buttons.length; i++) {

        if (buttons[i].dataset.id === page) {

            buttons[i].classList.add("active");
            buttons[i].setAttribute("aria-current", "page");

        } else {

            buttons[i].classList.remove("active");
            buttons[i].removeAttribute("aria-current");
        }
    }

    if (page === "Counter") {

        document.getElementById("counter").hidden = false;
        document.getElementById("manager").hidden = true;

        updateMenu();
        updateCart();

    } else if (page === "Products") {

        document.getElementById("counter").hidden = true;
        document.getElementById("manager").hidden = false;

        showProducts();

    } else if (page === "Customers") {

        document.getElementById("counter").hidden = true;
        document.getElementById("manager").hidden = false;

        showCustomers();

    } else if (page === "Orders") {

        document.getElementById("counter").hidden = true;
        document.getElementById("manager").hidden = false;

        showOrders();
    }
}


// 4. Product Filtering

function btnFilterOnAction(category) {

    currentFilter = category;

    let buttons = document.querySelectorAll("#filters button");

    for (let i = 0; i < buttons.length; i++) {

        if (buttons[i].dataset.id === category) {

            buttons[i].classList.add("active");
            buttons[i].setAttribute("aria-pressed", "true");

        } else {

            buttons[i].classList.remove("active");
            buttons[i].setAttribute("aria-pressed", "false");
        }
    }

    updateMenu();
}


// 5. Display Menu Products

function updateMenu() {

    let featuredProduct = findRecord(products, "double");

    let feature = document.getElementById("feature");

    if (featuredProduct !== null) {

        if (feature.querySelector(".hero") === null) {

            feature.innerHTML = originalHero;
        }

        feature.querySelector("h2").innerHTML =
            escapeHTML(featuredProduct.name).replace(/ (\S+)$/, "<br>$1");

        feature.querySelector("button").textContent =
            "Add to order · " + money(featuredProduct.price);

    } else {

        feature.innerHTML = "";
    }

    let searchText = document.getElementById("search")
        .value.trim().toLowerCase();

    let container = document.getElementById("cards");

    container.innerHTML = "";

    let visibleProducts = 0;

    for (let i = 0; i < products.length; i++) {

        let product = products[i];

        let categoryMatches = false;
        let searchMatches = false;

        if (currentFilter === "All") {

            categoryMatches = true;

        } else if (product.category === currentFilter) {

            categoryMatches = true;
        }

        if (product.name.toLowerCase().includes(searchText)) {

            searchMatches = true;
        }

        if (categoryMatches === true && searchMatches === true) {

            let image = "";

            if (product.photo) {

                image = `
                    <img src="${escapeHTML(getProductImage(product))}" alt="">
                `;

            } else {

                image = `
                    <div class="placeholder" aria-hidden="true">
                        GM
                    </div>
                `;
            }

            container.innerHTML += `

                <article class="card"
                    data-product-id="${escapeHTML(product.id)}">

                    ${image}

                    <div class="card-body">

                        <span class="category">
                            ${escapeHTML(product.category)}
                        </span>

                        <h3>${escapeHTML(product.name)}</h3>

                        <div class="card-bottom">

                            <strong>${money(product.price)}</strong>

                            <button type="button"
                                class="add"
                                data-action="add"
                                data-id="${escapeHTML(product.id)}"
                                aria-label="Add ${escapeHTML(product.name)}">
                                +
                            </button>

                        </div>

                    </div>

                </article>
            `;

            visibleProducts++;
        }
    }

    if (visibleProducts === 0) {

        document.getElementById("noProducts").hidden = false;

    } else {

        document.getElementById("noProducts").hidden = true;
    }
}


// 6. Add Product To Cart

function btnAddToCartOnAction(id) {

    let product = findRecord(products, id);

    if (product === null) {

        return;
    }

    for (let i = 0; i < cart.lines.length; i++) {

        if (cart.lines[i].id === id &&
            cart.lines[i].price === product.price &&
            cart.lines[i].name === product.name) {

            cart.lines[i].qty++;

            updateCart();

            return;
        }
    }

    let cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
    };

    cart.lines.push(cartItem);

    updateCart();
}


// 7. Increase Cart Quantity

function btnIncreaseQtyOnAction(index) {

    cart.lines[index].qty++;

    updateCart();
}


// 8. Decrease Cart Quantity

function btnDecreaseQtyOnAction(index) {

    cart.lines[index].qty--;

    if (cart.lines[index].qty === 0) {

        cart.lines.splice(index, 1);
    }

    updateCart();
}


// 9. Display Shopping Cart

function updateCart() {

    if (cart.editing === null) {

        document.getElementById("ticketTitle").textContent =
            "Current order";

        document.getElementById("checkout").textContent =
            "Complete order";

        document.getElementById("cancelEdit").hidden = true;

    } else {

        document.getElementById("ticketTitle").textContent =
            "Edit order #" + cart.editing;

        document.getElementById("checkout").textContent =
            "Save order changes";

        document.getElementById("cancelEdit").hidden = false;
    }

    let buyer = document.getElementById("buyer");

    buyer.innerHTML = `
        <option value="">Walk-in customer</option>
    `;

    for (let i = 0; i < customers.length; i++) {

        buyer.innerHTML += `

            <option value="${escapeHTML(customers[i].id)}">

                ${escapeHTML(customers[i].name)}

            </option>
        `;
    }

    buyer.value = cart.buyer;

    let cartContainer = document.getElementById("lines");

    cartContainer.innerHTML = "";

    let total = 0;

    for (let i = 0; i < cart.lines.length; i++) {

        let item = cart.lines[i];

        let itemTotal = item.price * item.qty;

        total = total + itemTotal;

        cartContainer.innerHTML += `

            <div class="line">

                <div class="row">

                    <strong>${escapeHTML(item.name)}</strong>

                    <span>${money(itemTotal)}</span>

                </div>

                <small>${money(item.price)} each</small>

                <div class="qty">

                    <button type="button"
                        data-action="minus"
                        data-id="${i}"
                        aria-label="Decrease quantity">
                        −
                    </button>

                    ${item.qty}

                    <button type="button"
                        data-action="plus"
                        data-id="${i}"
                        aria-label="Increase quantity">
                        +
                    </button>

                </div>

            </div>
        `;
    }

    if (cart.lines.length === 0) {

        cartContainer.innerHTML = `

            <div class="empty">

                <strong>Your ticket is empty</strong>

                Add a menu item to start an order.

            </div>
        `;

        document.getElementById("checkout").disabled = true;

    } else {

        document.getElementById("checkout").disabled = false;
    }

    document.getElementById("total").textContent = money(total);
}


// 10. Display Products Management Page

function showProducts() {

    let manager = document.getElementById("manager");

    manager.innerHTML = `

        <div class="manage-head">

            <h1>Products</h1>

            <button type="button"
                class="primary"
                data-action="new">
                + Product
            </button>

        </div>
    `;

    if (products.length === 0) {

        manager.innerHTML += `
            <p class="empty">No products yet.</p>
        `;

        return;
    }

    for (let i = 0; i < products.length; i++) {

        let product = products[i];

        manager.innerHTML += `

            <article class="record">

                <div>

                    <strong>${escapeHTML(product.name)}</strong>

                    <small>
                        ${escapeHTML(product.category)}
                        · ${money(product.price)}
                    </small>

                </div>

                <div class="actions">

                    <button type="button"
                        data-action="edit"
                        data-id="${escapeHTML(product.id)}">
                        Edit
                    </button>

                    <button type="button"
                        data-action="delete"
                        data-id="${escapeHTML(product.id)}">
                        Delete
                    </button>

                </div>

            </article>
        `;
    }
}


// 11. Display Customers Management Page

function showCustomers() {

    let manager = document.getElementById("manager");

    manager.innerHTML = `

        <div class="manage-head">

            <h1>Customers</h1>

            <button type="button"
                class="primary"
                data-action="new">
                + Customer
            </button>

        </div>
    `;

    if (customers.length === 0) {

        manager.innerHTML += `
            <p class="empty">No customers yet.</p>
        `;

        return;
    }

    for (let i = 0; i < customers.length; i++) {

        let customer = customers[i];

        let phone = customer.phone;

        if (phone === "") {

            phone = "No phone recorded";
        }

        manager.innerHTML += `

            <article class="record">

                <div>

                    <strong>${escapeHTML(customer.name)}</strong>

                    <small>${escapeHTML(phone)}</small>

                </div>

                <div class="actions">

                    <button type="button"
                        data-action="edit"
                        data-id="${escapeHTML(customer.id)}">
                        Edit
                    </button>

                    <button type="button"
                        data-action="delete"
                        data-id="${escapeHTML(customer.id)}">
                        Delete
                    </button>

                </div>

            </article>
        `;
    }
}


// 12. Display Orders Management Page

function showOrders() {

    let manager = document.getElementById("manager");

    manager.innerHTML = `

        <div class="manage-head">

            <h1>Orders</h1>

            <button type="button"
                class="primary"
                data-action="new">
                + Order
            </button>

        </div>
    `;

    if (orders.length === 0) {

        manager.innerHTML += `
            <p class="empty">No orders yet.</p>
        `;

        return;
    }

    for (let i = orders.length - 1; i >= 0; i--) {

        let order = orders[i];

        let orderTotal = calculateTotal(order.lines);

        let orderDate = new Date(order.date).toLocaleString();

        manager.innerHTML += `

            <article class="record">

                <div>

                    <strong>
                        Order #${order.id}
                        · ${escapeHTML(order.buyerName)}
                    </strong>

                    <small>
                        ${escapeHTML(orderDate)}
                        · ${money(orderTotal)}
                    </small>

                </div>

                <div class="actions">

                    <button type="button"
                        data-action="view"
                        data-id="${order.id}">
                        View / print bill
                    </button>

                    <button type="button"
                        data-action="edit"
                        data-id="${order.id}">
                        Edit
                    </button>

                    <button type="button"
                        data-action="delete"
                        data-id="${order.id}">
                        Delete
                    </button>

                </div>

            </article>
        `;
    }
}


function getProductImage(product) {

    if (!product.photo) {
        return "";
    }

    if (product.photo.startsWith("data:image/")) {
        return product.photo;
    }

    return "assets/" + product.photo + ".jpg";
}


function productImageOnChange() {

    let input = document.getElementById("productImage");
    let preview = document.getElementById("imagePreview");
    let file = input.files[0];

    if (!file) {
        return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
        showMessage("Select a JPG, PNG or WebP image up to 2 MB.");
        input.value = "";
        return;
    }

    let reader = new FileReader();
    let submit = document.getElementById("submit");
    submit.disabled = true;
    input.disabled = true;

    reader.onload = function () {
        if (!input.isConnected) return;
        selectedImage = reader.result;
        preview.src = selectedImage;
        preview.hidden = false;
        submit.disabled = false;
        input.disabled = false;
    };

    reader.onerror = function () {
        if (!input.isConnected) return;
        showMessage("Unable to read image.");
        submit.disabled = false;
        input.disabled = false;
    };

    reader.readAsDataURL(file);
}


// 13. Add Product Form

function btnAddProductOnAction() {

    selectedRecord = null;
    selectedImage = "";

    document.getElementById("submit").disabled = false;
    modalMode = "product";

    document.getElementById("modalTitle").textContent =
        "Add product";

    document.getElementById("fields").innerHTML = `

        <label>
            Name

            <input type="text"
                name="name"
                required
                maxlength="70">
        </label>

        <label>
            Category

            <select name="category">

                <option value="Burgers">Burgers</option>
                <option value="Fries">Fries</option>
                <option value="Drinks">Drinks</option>

            </select>
        </label>

        <label>
            Unit price (LKR)

            <input type="number"
                name="price"
                min="0.01"
                max="999999"
                step="0.01"
                required>
        </label>

        <label>
            Product Image
            <input type="file" id="productImage"
                accept="image/jpeg,image/png,image/webp"
                onchange="productImageOnChange()">
        </label>
        <img id="imagePreview" alt="Product image preview" hidden>
    `;

    document.getElementById("submit").textContent =
        "Save product";

    document.getElementById("modal").showModal();
}


// 14. Edit Product Form

function btnEditProductOnAction(id) {

    selectedRecord = findRecord(products, id);

    if (selectedRecord === null) {

        return;
    }

    document.getElementById("submit").disabled = false;
    selectedImage = selectedRecord.photo || "";
    modalMode = "product";

    document.getElementById("modalTitle").textContent =
        "Edit product";

    document.getElementById("fields").innerHTML = `

        <label>
            Name

            <input type="text"
                name="name"
                required
                maxlength="70"
                value="${escapeHTML(selectedRecord.name)}">
        </label>

        <label>
            Category

            <select name="category">

                <option value="Burgers">Burgers</option>
                <option value="Fries">Fries</option>
                <option value="Drinks">Drinks</option>

            </select>
        </label>

        <label>
            Unit price (LKR)

            <input type="number"
                name="price"
                min="0.01"
                max="999999"
                step="0.01"
                required
                value="${selectedRecord.price / 100}">
        </label>

        <label>
            Product Image
            <input type="file" id="productImage"
                accept="image/jpeg,image/png,image/webp"
                onchange="productImageOnChange()">
        </label>
        <img id="imagePreview" alt="Product image preview" hidden>
    `;

    document.querySelector('[name="category"]').value =
        selectedRecord.category;

    if (selectedRecord.photo) {
        let preview = document.getElementById("imagePreview");
        preview.src = getProductImage(selectedRecord);
        preview.hidden = false;
    }

    document.getElementById("submit").textContent =
        "Save product";

    document.getElementById("modal").showModal();
}


// 15. Save Product

function btnSaveProductOnAction() {

    let name = document.querySelector('[name="name"]')
        .value.trim();

    let category = document.querySelector('[name="category"]')
        .value;

    let price = Number(
        document.querySelector('[name="price"]').value
    );

    if (name === "") {

        showMessage("Enter a product name.");

        return false;
    }

    if (price <= 0 || price > 999999 || isNaN(price)) {

        showMessage("Enter a valid product price.");

        return false;
    }

    price = Math.round(price * 100);

    if (selectedRecord === null) {

        let product = {
            id: crypto.randomUUID(),
            name: name,
            category: category,
            price: price,
            photo: selectedImage
        };

        products.push(product);

        showMessage("Product added successfully.");

    } else {

        selectedRecord.name = name;
        selectedRecord.category = category;
        selectedRecord.price = price;
        selectedRecord.photo = selectedImage;

        showMessage("Product updated successfully.");
    }

    showProducts();

    return true;
}


// 16. Add Customer Form

function btnAddCustomerOnAction() {

    selectedRecord = null;

    modalMode = "customer";

    document.getElementById("modalTitle").textContent =
        "Add customer";

    document.getElementById("fields").innerHTML = `

        <label>
            Name

            <input type="text"
                name="name"
                required
                maxlength="70">
        </label>

        <label>
            Phone (optional)

            <input type="tel"
                name="phone"
                maxlength="30">
        </label>
    `;

    document.getElementById("submit").textContent = "Save customer";

    document.getElementById("modal").showModal();
}


// 17. Edit Customer Form

function btnEditCustomerOnAction(id) {

    selectedRecord = findRecord(customers, id);

    if (selectedRecord === null) {

        return;
    }

    modalMode = "customer";

    document.getElementById("modalTitle").textContent =
        "Edit customer";

    document.getElementById("fields").innerHTML = `

        <label>
            Name

            <input type="text"
                name="name"
                required
                maxlength="70"
                value="${escapeHTML(selectedRecord.name)}">
        </label>

        <label>
            Phone (optional)

            <input type="tel"
                name="phone"
                maxlength="30"
                value="${escapeHTML(selectedRecord.phone)}">
        </label>
    `;

    document.getElementById("submit").textContent =
        "Save customer";

    document.getElementById("modal").showModal();
}


// 18. Save Customer

function btnSaveCustomerOnAction() {

    let name = document.querySelector('[name="name"]')
        .value.trim();

    let phone = document.querySelector('[name="phone"]')
        .value.trim();

    if (name === "") {

        showMessage("Enter a customer name.");

        return false;
    }

    if (selectedRecord === null) {

        let customer = {
            id: crypto.randomUUID(),
            name: name,
            phone: phone
        };

        customers.push(customer);

        showMessage("Customer added successfully.");

    } else {

        selectedRecord.name = name;
        selectedRecord.phone = phone;

        showMessage("Customer updated successfully.");
    }

    showCustomers();

    return true;
}


// 19. Add New Record

function btnNewOnAction() {

    if (currentPage === "Products") {

        btnAddProductOnAction();

    } else if (currentPage === "Customers") {

        btnAddCustomerOnAction();

    } else if (currentPage === "Orders") {

        if (cart.editing !== null) {

            showMessage("Save or cancel the current order edit first.");

            return;
        }

        btnPageOnAction("Counter");
    }
}


// 20. Edit Record

function btnEditOnAction(id) {

    if (currentPage === "Products") {

        btnEditProductOnAction(id);

    } else if (currentPage === "Customers") {

        btnEditCustomerOnAction(id);

    } else if (currentPage === "Orders") {

        btnEditOrderOnAction(id);
    }
}


// 21. Delete Confirmation

function btnDeleteOnAction(id) {

    let name = "";

    if (currentPage === "Products") {

        selectedType = "products";

        selectedRecord = findRecord(products, id);

    } else if (currentPage === "Customers") {

        selectedType = "customers";

        selectedRecord = findRecord(customers, id);

    } else if (currentPage === "Orders") {

        selectedType = "orders";

        selectedRecord = findRecord(orders, id);
    }

    if (selectedRecord === null) {

        return;
    }

    if (selectedType === "orders") {

        name = "Order #" + selectedRecord.id;

    } else {

        name = selectedRecord.name;
    }

    modalMode = "delete";

    document.getElementById("modalTitle").textContent =
        "Confirm deletion";

    document.getElementById("fields").innerHTML = `
        <p>Delete ${escapeHTML(name)}?</p>
    `;

    document.getElementById("submit").textContent = "Delete";

    document.getElementById("modal").showModal();
}


// 22. Delete Product, Customer Or Order

function confirmDelete() {

    if (selectedType === "products") {

        for (let i = 0; i < products.length; i++) {

            if (products[i].id === selectedRecord.id) {

                products.splice(i, 1);

                break;
            }
        }

        showProducts();

        showMessage("Product deleted successfully.");

    } else if (selectedType === "customers") {

        for (let i = 0; i < customers.length; i++) {

            if (customers[i].id === selectedRecord.id) {

                customers.splice(i, 1);

                break;
            }
        }

        if (cart.buyer === selectedRecord.id) {

            cart.buyer = "";
        }

        if (parkedCart !== null) {

            if (parkedCart.buyer === selectedRecord.id) {

                parkedCart.buyer = "";
            }
        }

        showCustomers();

        showMessage("Customer deleted successfully.");

    } else if (selectedType === "orders") {

        for (let i = 0; i < orders.length; i++) {

            if (orders[i].id === selectedRecord.id) {

                orders.splice(i, 1);

                break;
            }
        }

        if (cart.editing === selectedRecord.id) {

            if (parkedCart !== null) {

                cart = parkedCart;

            } else {

                cart = {
                    lines: [],
                    buyer: "",
                    editing: null
                };
            }

            parkedCart = null;
        }

        showOrders();

        showMessage("Order deleted successfully.");
    }

    return true;
}


// 23. Edit Existing Order

function btnEditOrderOnAction(id) {

    let order = findRecord(orders, id);

    if (order === null) {

        return;
    }

    if (cart.editing !== null && cart.editing !== order.id) {

        showMessage("Save or cancel the current order edit first.");

        return;
    }

    if (cart.editing === null) {

        parkedCart = cart;

        let buyer = "";

        for (let i = 0; i < customers.length; i++) {

            if (customers[i].id === order.buyer) {

                buyer = order.buyer;

                break;
            }
        }

        let orderLines = [];

        for (let i = 0; i < order.lines.length; i++) {

            let item = {
                id: order.lines[i].id,
                name: order.lines[i].name,
                price: order.lines[i].price,
                qty: order.lines[i].qty
            };

            orderLines.push(item);
        }

        cart = {
            lines: orderLines,
            buyer: buyer,
            editing: order.id
        };
    }

    btnPageOnAction("Counter");
}


// 24. Cancel Order Editing

function btnCancelEditOnAction() {

    if (parkedCart !== null) {

        cart = parkedCart;

    } else {

        cart = {
            lines: [],
            buyer: "",
            editing: null
        };
    }

    parkedCart = null;

    updateCart();

    showMessage("Order editing cancelled.");
}


// 25. Complete Order

function btnCompleteOrderOnAction() {

    if (cart.lines.length === 0) {

        showMessage("Add products to the cart first.");

        return;
    }

    let order;

    if (cart.editing !== null) {

        order = findRecord(orders, cart.editing);

        if (order === null) {

            showMessage("Order not found.");

            return;
        }

        order.buyer = cart.buyer;

        order.buyerName = getCustomerName(cart.buyer);

        order.lines = cart.lines;

    } else {

        order = {
            id: nextOrderNumber,
            date: new Date().toISOString(),
            buyer: cart.buyer,
            buyerName: getCustomerName(cart.buyer),
            lines: cart.lines
        };

        orders.push(order);

        nextOrderNumber++;
    }

    if (parkedCart !== null) {

        cart = parkedCart;

    } else {

        cart = {
            lines: [],
            buyer: "",
            editing: null
        };
    }

    parkedCart = null;

    updateCart();

    showMessage("Order #" + order.id + " saved.");

    showBill(order);
}


// 26. View Order Bill

function btnViewBillOnAction(id) {

    let order = findRecord(orders, id);

    if (order !== null) {

        showBill(order);
    }
}


// 27. Display Order Bill

function showBill(order) {

    let rows = "";

    let total = 0;

    for (let i = 0; i < order.lines.length; i++) {

        let item = order.lines[i];

        let amount = item.price * item.qty;

        total = total + amount;

        rows += `

            <tr>

                <td>${escapeHTML(item.name)}</td>

                <td>${item.qty}</td>

                <td>${money(item.price)}</td>

                <td>${money(amount)}</td>

            </tr>
        `;
    }

    billHTML = `

        <article class="bill">

            <h2>GrillMaster</h2>

            <p>
                <strong>Bill #${order.id}</strong>
            </p>

            <p>
                ${escapeHTML(new Date(order.date).toLocaleString())}
            </p>

            <p>
                Customer: ${escapeHTML(order.buyerName)}
            </p>

            <table>

                <thead>

                    <tr>

                        <th>Item</th>

                        <th>Qty</th>

                        <th>Unit price</th>

                        <th>Amount</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

            <p class="bill-total">

                <strong>Total</strong>

                <strong>${money(total)}</strong>

            </p>

        </article>
    `;

    modalMode = "print";

    document.getElementById("modalTitle").textContent =
        "Order bill";

    document.getElementById("fields").innerHTML = billHTML;

    document.getElementById("submit").textContent =
        "Print bill";

    document.getElementById("modal").showModal();
}


// 28. Print Bill

function btnPrintBillOnAction() {

    document.getElementById("printedBill").innerHTML =
        billHTML;

    window.print();
}


// 29. Customer Selection

function buyerOnChange() {

    cart.buyer = document.getElementById("buyer").value;
}


// 30. Close Modal

function btnCloseModalOnAction() {

    document.getElementById("modal").close();
}


// 31. Form Submission

function submitForm(event) {

    event.preventDefault();

    let success = false;

    if (modalMode === "product") {

        success = btnSaveProductOnAction();

    } else if (modalMode === "customer") {

        success = btnSaveCustomerOnAction();

    } else if (modalMode === "delete") {

        success = confirmDelete();

    } else if (modalMode === "print") {

        btnPrintBillOnAction();
    }

    if (success === true) {

        document.getElementById("modal").close();
    }
}


// 32. Button Click Events

document.addEventListener("click", function (event) {

    let button = event.target.closest("[data-action]");

    if (button === null) {

        return;
    }

    let action = button.dataset.action;

    let id = button.dataset.id;

    if (action === "page") {

        btnPageOnAction(id);

    } else if (action === "filter") {

        btnFilterOnAction(id);

    } else if (action === "add") {

        btnAddToCartOnAction(id);

    } else if (action === "plus") {

        btnIncreaseQtyOnAction(Number(id));

    } else if (action === "minus") {

        btnDecreaseQtyOnAction(Number(id));

    } else if (action === "new") {

        btnNewOnAction();

    } else if (action === "edit") {

        btnEditOnAction(id);

    } else if (action === "delete") {

        btnDeleteOnAction(id);

    } else if (action === "view") {

        btnViewBillOnAction(id);
    }
});


// 33. Search Event

document.getElementById("search").addEventListener("input", function () {

    updateMenu();
});


// 34. Buyer Change Event

document.getElementById("buyer").onchange = function () {

    buyerOnChange();
};


// 35. Cancel Edit Button Event

document.getElementById("cancelEdit").onclick = function () {

    btnCancelEditOnAction();
};


// 36. Modal Close Event

document.getElementById("modal").addEventListener("close", function () {

    document.getElementById("printedBill").innerHTML = "";
});


// 37. Close Button Event

document.getElementById("close").onclick = function () {

    btnCloseModalOnAction();
};


// 38. Form Submit Event

document.getElementById("form").onsubmit = function (event) {

    submitForm(event);
};


// 39. Checkout Button Event

document.getElementById("checkout").onclick = function () {

    btnCompleteOrderOnAction();
};

document.getElementById("modal").addEventListener("close", function () {
    document.getElementById("submit").disabled = false;
});