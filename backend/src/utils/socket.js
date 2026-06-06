let io = null;

function init(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  return io;
}

const lastEmitTimes = new Map();

function emitProgress(downloadId, progress, speed, size) {
  if (io) {
    const now = Date.now();
    const lastEmit = lastEmitTimes.get(downloadId) || 0;

    if (progress === 100 || lastEmit === 0 || now - lastEmit >= 500) {
      io.emit("descarga:progreso", { downloadId, porcentaje: progress, velocidad: speed, tamaño: size });
      lastEmitTimes.set(downloadId, now);
    }
  }
}

function emitComplete(downloadId, filePath, fileName) {
  lastEmitTimes.delete(downloadId);
  if (io) {
    io.emit("descarga:completa", { downloadId, ruta: filePath, nombreArchivo: fileName });
  }
}

function emitError(downloadId, message) {
  lastEmitTimes.delete(downloadId);
  if (io) {
    io.emit("descarga:error", { downloadId, mensaje: message });
  }
}

module.exports = {
  init,
  getIo,
  emitProgress,
  emitComplete,
  emitError
};
