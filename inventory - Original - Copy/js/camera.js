// Enhanced camera.js script for barcode scanning

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
    stopStream();
    modal.classList.remove("active");
  };

  closeModalButton.addEventListener("click", closeModal);

  const initScanner = () => {
    if (window.Quagga) {
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
          barcodeField.value = barcode;
          console.log("Barcode detected:", barcode);
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
    showModal();
    initScanner();
  });

  return { showModal, closeModal };
})();
