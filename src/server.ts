import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import entradaRoutes from './routes/entradas';
import jackpotRoutes from './routes/jackpot'
import saidasRoutes from './routes/saidas'
import eventosRoutes from './routes/eventos';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🟢 API Jackpot rodando!');
});

app.use('/entradas', entradaRoutes);
app.use('/jackpot', jackpotRoutes)
app.use('/saidas', saidasRoutes)
app.use('/eventos', eventosRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});