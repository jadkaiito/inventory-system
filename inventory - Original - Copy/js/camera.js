// Complete and fixed camera.js script for GitHub Pages compatibility

// Ensure all canvas contexts use willReadFrequently
(function patchCanvasContext() {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, options) {
    if (type === "2d") {
      options = options || {};
      options.willReadFrequently = true;
    }
    return originalGetContext.call(this, type, options);
  };
  console.log("Canvas context patched to include willReadFrequently.");
})();

const CameraScanner = (() => {
  let stream = null;
  const modal = document.getElementById("cameraModal");
  const videoElement = document.getElementById("video");
  const closeModalButton = document.getElementById("closeModal");
  const barcodeField = document.getElementById("barcode");

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      console.log("Camera stream stopped");
    }
  };

  const showModal = () => {
    console.log("Opening camera modal...");
    modal.classList.add("active");

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => {
        stream = mediaStream;
        videoElement.srcObject = stream;
        videoElement.play().catch((err) => {
          console.error("Error playing video stream:", err);
          alert("Unable to display the camera feed.");
          stopStream();
          closeModal();
        });
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
        alert("Unable to access the camera.");
      });
  };

  const closeModal = () => {
    console.log("Closing camera modal...");
    stopStream();
    modal.classList.remove("active");
  };

  closeModalButton.addEventListener("click", closeModal);

  const initScanner = () => {
    if (window.Quagga) {
      console.log("Initializing Quagga scanner...");
      Quagga.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoElement,
          },
          decoder: {
            readers: ["code_128_reader", "ean_reader"],
          },
        },
        (err) => {
          if (err) {
            console.error("Quagga initialization failed:", err);
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected((data) => {
        const barcode = data.codeResult.code;
        if (barcode) {
          console.log("Barcode detected:", barcode);
          barcodeField.value = barcode;
          stopStream();
          closeModal();
        } else {
          console.warn("No barcode detected.");
        }
      });
    } else {
      console.error("Quagga.js not loaded.");
      alert("Barcode scanner is unavailable. Please check your setup.");
    }
  };

  document.getElementById("startScanner").addEventListener("click", () => {
    console.log("Start Scanner button clicked.");
    showModal();
    initScanner();
  });

  return { showModal, closeModal };
})();

// Function to fetch and display inventory
async function fetchInventory() {
  try {
    const response = await fetch("default_inventory.json"); // Adjusted path for GitHub Pages
    if (!response.ok) throw new Error("Failed to load inventory");

    const inventory = await response.json();
    const tbody = document.querySelector("#inventoryTable tbody");
    tbody.innerHTML = ""; // Clear table
    inventory.forEach((item, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${item.barcode}</td>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.price}</td>
          <td><button onclick="deleteItem(${index})">Delete</button></td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error loading inventory:", error);
  }
}

// Function to save inventory (for demonstration only; GitHub Pages does not support backend APIs)
async function saveInventory(inventory) {
  console.log("Save inventory simulation:", inventory);
  alert("Inventory changes saved locally.");
}

// Event listener for the form submission to add an item
const addItemForm = document.getElementById("addItemForm");
addItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const barcode = document.getElementById("barcode").value;
  const name = document.getElementById("name").value;
  const quantity = +document.getElementById("quantity").value;
  const price = +document.getElementById("price").value;

  const response = await fetch("default_inventory.json");
  const inventory = await response.json();
  inventory.push({ barcode, name, quantity, price });

  await saveInventory(inventory);
  fetchInventory();
});

// Function to delete an item
async function deleteItem(index) {
  const response = await fetch("default_inventory.json");
  const inventory = await response.json();

  inventory.splice(index, 1); // Remove item
  await saveInventory(inventory);
  fetchInventory();
}

// Initial inventory load
fetchInventory();
