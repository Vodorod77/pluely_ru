#!/bin/bash
# Финальный скрипт запуска Pluely с русским переводом

echo "========================================="
echo "  ЗАПУСК PLUELY С РУССКИМ ПЕРЕВОДОМ"
echo "========================================="
echo ""

cd "$(dirname "$0")"

# Останавливаем старые процессы
pkill -9 -f "vite"
pkill -9 -f "pluely"
sleep 2

# Запускаем Vite dev server
echo "→ Запуск Vite dev server..."
npm run dev > /tmp/pluely-vite.log 2>&1 &
VITE_PID=$!

# Ждем пока Vite запустится
echo "→ Ожидание (8 секунд)..."
sleep 8

# Проверяем что Vite запустился
if ! curl -s http://localhost:1420 > /dev/null 2>&1; then
    echo "✗ Ошибка: Vite не запустился!"
    echo "Лог: /tmp/pluely-vite.log"
    kill $VITE_PID 2>/dev/null
    exit 1
fi

echo "✓ Vite запущен"
echo ""
echo "→ Запуск приложения..."
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  ПРИЛОЖЕНИЕ ОТКРОЕТСЯ КАК ОТДЕЛЬНОЕ ОКНО  ║"
echo "║                                           ║"
echo "║  Ищите иконку 🌐 для переключения языка!  ║"
echo "║                                           ║"
echo "║  Нажмите Ctrl+C для остановки             ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Очищаем переменные snap и запускаем
env -i \
  HOME="$HOME" \
  USER="$USER" \
  PATH="/usr/local/bin:/usr/bin:/bin:$HOME/.nvm/versions/node/v20.19.5/bin:$HOME/.cargo/bin" \
  DISPLAY="${DISPLAY:-:0}" \
  XAUTHORITY="${XAUTHORITY:-$HOME/.Xauthority}" \
  DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=/run/user/$(id -u)/bus}" \
  XDG_RUNTIME_DIR="/run/user/$(id -u)" \
  ./src-tauri/target/debug/pluely 2>&1 | tee /tmp/pluely-app.log

# Когда приложение закроется, останавливаем Vite
echo ""
echo "→ Остановка Vite server..."
kill $VITE_PID 2>/dev/null
echo "✓ Готово"
