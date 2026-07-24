// Cloudflare Worker URL
const workerURL = "https://loreal-chatbot.loube1sl.workers.dev/";

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const generateRoutine = document.getElementById("generateRoutine");

let selectedProducts = [];
let conversation = [
  {
    role: "system",
    content: "You are a helpful L'Oréal beauty assistant. Answer only questions about L'Oréal products, skincare, haircare, makeup, fragrances, beauty routines, and recommendations. Politely refuse unrelated questions."
  }
];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
    const response = await fetch("products.json");

    if (!response.ok) {
        throw new Error("Failed to load products");
    }

    const data = await response.json();
    return data.products;
};
/* Create HTML for displaying product cards */
function displayProducts(products) {

    productsContainer.innerHTML = "";

    products.forEach(product => {

    const card = document.createElement("div");
    card.className = "product-card";

        card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <p class="description">${product.description}</p>
        </div>
    `;

        card.addEventListener("click", () => {
            toggleProduct(product, card);
        });

        productsContainer.appendChild(card);

    });

}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const question = userInput.value;

    conversation.push({
    role: "user",
    content: question
    });

    const response=await fetch(workerURL,{

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            messages:conversation

        })

    });

    if (!response.ok) {
    throw new Error("Server error");
}
    const data=await response.json();

    conversation.push(

        data.choices[0].message

    );

    chatWindow.innerHTML+=`

        <p><b>You:</b> ${question}</p>

        <p><b>AI:</b>
        ${data.choices[0].message.content}</p>

    `;

    userInput.value = "";

});

function toggleProduct(product, card) {

    const exists = selectedProducts.find(p => p.name === product.name);

    if (exists) {

        selectedProducts = selectedProducts.filter(
            p => p.name !== product.name
        );

        card.classList.remove("selected");

    } else {

        selectedProducts.push(product);

        card.classList.add("selected");

    }

    updateSelectedProducts();

    saveProducts();

}

function updateSelectedProducts(){

    const list = document.getElementById("selectedProductsList");

    list.innerHTML = "";

    selectedProducts.forEach(product=>{

        const item=document.createElement("div");

        item.innerHTML=`
            ${product.name}
            <button data-name="${product.name}">
                Remove
            </button>
        `;

        item.querySelector("button").onclick=()=>{

            selectedProducts=
                selectedProducts.filter(
                    p=>p.name!==product.name
                );

            updateSelectedProducts();

            saveProducts();

        };

        list.appendChild(item);

    });

}

function saveProducts(){

    localStorage.setItem(

        "selectedProducts",

        JSON.stringify(selectedProducts)

    );

}

function loadSavedProducts(){

    const saved=

        localStorage.getItem("selectedProducts");

    if(saved){

        selectedProducts=JSON.parse(saved);

        updateSelectedProducts();

    }

}

loadSavedProducts();

generateRoutine.addEventListener("click", async () => {

    if (selectedProducts.length === 0) {
        alert("Select products first");
        return;
    }

    const response = await fetch(workerURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: [
                {
                    role: "system",
                    content: "You are a L'Oréal beauty advisor."
                },
                {
                    role: "user",
                    content: `Create a skincare routine using only these products:

${JSON.stringify(selectedProducts)}`
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error("Server error");
    }

    const data = await response.json();

    conversation.push(data.choices[0].message);

    chatWindow.innerHTML += `
        <p><b>Routine:</b></p>
        <p>${data.choices[0].message.content}</p>
    `;
});



