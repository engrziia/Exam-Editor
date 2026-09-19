// === File: main.js ===
// Optimized Electron main process for faster startup and better practices.

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { jsPDF } = require('jspdf');

let mainWindow;

function createWindow() {
  // Create the main browser window with specific settings for the exam app.
  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  // Fully clear the menu to prevent any default menu items from appearing.
  const emptyMenu = Menu.buildFromTemplate([]);
  Menu.setApplicationMenu(emptyMenu);

  // Disable right-click context menu for a locked-down experience.
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Use a promise-based approach with 'ipcMain.handle' for submitting content.
ipcMain.handle('submit-exam', async (event, { studentName, examTitle, content }) => {
  console.log("Main process received 'submit-exam' request.");
  try {
    const safeName = studentName.trim().replace(/\s+/g, '_') || 'Student';
    const safeTitle = examTitle.trim().replace(/\s+/g, '_') || 'Exam';
    const fileName = `${safeName}_${safeTitle}.pdf`;
    const filePath = path.join(app.getPath('desktop'), fileName);

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Calculate the widths of the labels and the data
    const labelStudentWidth = doc.getStringUnitWidth('Student Name:') * 12;
    const labelExamWidth = doc.getStringUnitWidth('Exam Title:') * 12;
    const valueStudentWidth = doc.getStringUnitWidth(studentName) * 12;
    const valueExamWidth = doc.getStringUnitWidth(examTitle) * 12;

    // Find the max width for each column to ensure perfect alignment
    const maxLabelWidth = Math.max(labelStudentWidth, labelExamWidth);
    const maxValueWidth = Math.max(valueStudentWidth, valueExamWidth);

    const totalHeaderWidth = maxLabelWidth + maxValueWidth + 5; // 5 is a fixed space between label and value

    // Calculate the starting position for the centered header block.
    const startX = (pageW - totalHeaderWidth) / 2;
    const valueX = startX + maxLabelWidth + 5;

    // Add header information.
    doc.setTextColor(0);
    doc.setFontSize(12);

    // Student Name and value on the same line, aligned
    doc.text('Student Name:', startX, 10);
    doc.setFont('helvetica', 'bold');
    doc.text(studentName, valueX, 10);
    doc.setFont('helvetica', 'normal');

    // Exam Title and value on the next line, aligned
    doc.text('Exam Title:', startX, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(examTitle, valueX, 20);
    doc.setFont('helvetica', 'normal');

    // Add the body text from the editor, handling multiple pages
    const margin = 10;
    const lineHeight = 1.1;
    const maxTextWidth = pageW - 2 * margin;
    let cursorY = 30;

    const lines = doc.splitTextToSize(content, maxTextWidth);

    for (let i = 0; i < lines.length; i++) {
      if (cursorY + lineHeight * doc.getFontSize() > pageH - margin) {
        doc.addPage();
        doc.setTextColor(0);
        doc.setFontSize(12);
        cursorY = margin;
      }
      doc.text(lines[i], margin, cursorY);
      cursorY += lineHeight * doc.getFontSize();
    }

    // Save the PDF file to the desktop.
    doc.save(filePath);
    console.log(`PDF saved successfully to ${filePath}`);

    // Return a success message to the renderer process.
    return { success: true, message: `Exam saved to ${filePath}` };
  } catch (error) {
    console.error('Error saving PDF:', error);
    // Return an error message if the save operation fails.
    return { success: false, message: `Failed to save exam: ${error.message}` };
  }
});

// A listener to handle the renderer process requesting the app to close.
ipcMain.on('exit-app', () => {
  app.quit();
});

// App ready event listener.
app.on('ready', createWindow);

// Quit the app when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});