# 🚀 Mecânica Adrian - Setup Linux & Atalhos

## ⚡ Forma Rápida (Recomendado)

### 1️⃣ Primeira vez - Instalar tudo:
```bash
cd /home/laiz/Downloads/Mecanica-Adrian
npm install
chmod +x Iniciar_Sistema.sh
./Iniciar_Sistema.sh
```

### 2️⃣ Próximas vezes - Apenas rodar:
```bash
/home/laiz/Downloads/Mecanica-Adrian/Iniciar_Sistema.sh
```

---

## 🎯 Criar Atalho na Área de Trabalho (Clique e Pronto!)

### Opção A: Atalho Simples (Desktop)

1. Copie o arquivo `.desktop` para a área de trabalho:
```bash
cp /home/laiz/Downloads/Mecanica-Adrian/Mecanica-Adrian.desktop ~/Desktop/
chmod +x ~/Desktop/Mecanica-Adrian.desktop
```

2. **Clique 2x no atalho para abrir!** 🎉

### Opção B: Menu de Aplicações (como um programa normal)

1. Copie para o menu do sistema:
```bash
mkdir -p ~/.local/share/applications
cp /home/laiz/Downloads/Mecanica-Adrian/Mecanica-Adrian.desktop ~/.local/share/applications/
```

2. **Procure por "Mecânica Adrian" no seu menu de aplicações!**

### Opção C: Atalho no Terminal (bash alias)

Adicione ao final do seu `~/.bashrc`:
```bash
alias mecanica='bash /home/laiz/Downloads/Mecanica-Adrian/Iniciar_Sistema.sh'
```

Depois:
1. `source ~/.bashrc`
2. Próximas vezes: `mecanica` + Enter

---

## 📱 Acessar de Outro Computador na Rede

Se quiser acessar de outro PC/celular na mesma rede:

**Na máquina Linux rodando o sistema:**
```bash
# Execute isto no terminal
./node_modules/.bin/serve -s dist -l 0.0.0.0:8080
```

**No outro dispositivo:**
```
http://IP_DO_SEU_PC:8080
```

---

## 🔌 Funciona 100% Offline!

- ✅ Sem internet = sem problema
- ✅ Todos os dados salvos localmente (IndexedDB)
- ✅ Funciona como um app nativo
- ✅ Pode instalar como PWA (clique no URL → "Instalar")

---

## ⚙️ Parar o Sistema

```bash
# Mata o servidor
killall serve

# Ou mata manualmente a porta 8080
kill -9 $(lsof -t -i:8080)
```

---

## 🐛 Problema? Teste isto:

```bash
# Limpar tudo e reconstruir
cd /home/laiz/Downloads/Mecanica-Adrian
rm -rf dist node_modules
npm install
npm run build
./Iniciar_Sistema.sh
```

---

**Pronto! Agora você tem um sistema offline e rápido! 🎉**
