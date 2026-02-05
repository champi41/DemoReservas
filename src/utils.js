const horaAMinutos = (horaStr) => {
  const [h, m] = horaStr.split(":").map(Number);
  return h * 60 + m;
};

const minutosAHora = (minutos) => {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};
