// === File: renderer.js ===
// All client-side JavaScript logic is moved here for better organization.

document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn');
  const timerDisplay = document.getElementById('timer');

  // Modals for confirmation, messages, and loading
  const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  const messageModalOverlay = document.getElementById('message-modal-overlay');
  const messageTitle = document.getElementById('message-title');
  const messageText = document.getElementById('message-text');
  const messageCloseBtn = document.getElementById('message-close-btn');

  const loadingModalOverlay = document.getElementById('loading-modal-overlay');

  // Timer logic
  let seconds = 0;
  setInterval(() => {
    seconds++;
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
  }, 1000);

  // Function to show a custom message modal
  const showMessage = (title, text) => {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageModalOverlay.style.display = 'flex';
  };

  // Show the custom confirmation modal on submit button click
  submitBtn.addEventListener('click', () => {
    console.log("Main 'Save & Submit' button clicked.");
    if (confirmationModalOverlay) {
      confirmationModalOverlay.style.display = 'flex';
    }
  });

  // Handle the confirmation modal's confirm button
  if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener('click', async () => {
      console.log("Confirmation 'Submit' button clicked.");
      // Hide the confirmation modal and show the loading spinner immediately
      if (confirmationModalOverlay) {
        confirmationModalOverlay.style.display = 'none';
      }
      if (loadingModalOverlay) {
        loadingModalOverlay.style.display = 'flex';
      }

      const examTitle = document.getElementById('examTitle').value;
      const studentName = document.getElementById('studentName').value;
      const content = document.getElementById('editor').value;

      try {
        console.log("Attempting to submit exam data to main process...");
        const result = await window.examAPI.submit({ studentName, examTitle, content });
        console.log("Received response from main process:", result);

        if (result.success) {
          showMessage('Success!', result.message);
        } else {
          showMessage('Error!', result.message);
        }
      } catch (error) {
        showMessage('Error!', 'An unexpected error occurred during submission.');
        console.error("Error during submission:", error);
      } finally {
        if (loadingModalOverlay) {
          loadingModalOverlay.style.display = 'none';
        }
      }
    });
  }

  // Handle the confirmation modal's cancel button
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', () => {
      console.log("Confirmation 'Cancel' button clicked.");
      if (confirmationModalOverlay) {
        confirmationModalOverlay.style.display = 'none';
      }
    });
  }

  // Handle the message modal's close button
  if (messageCloseBtn) {
    messageCloseBtn.addEventListener('click', () => {
      console.log("Message modal 'OK' button clicked.");
      if (messageModalOverlay) {
        messageModalOverlay.style.display = 'none';
      }
      // Only exit the app if the submission was successful
      if (messageTitle.textContent === 'Success!') {
        window.examAPI.exitApp();
      }
    });
  }
});
