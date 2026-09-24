export type DrawingIconFamily = "emojis" | "stickers" | "icons";

export interface DrawingIconCategory {
  id: string;
  label: string;
  navSymbol: string;
  symbols: readonly string[];
}

const symbols = (value: string): readonly string[] => value.trim().split(/\s+/u).filter(Boolean);

export const EMOJI_CATEGORIES: readonly DrawingIconCategory[] = [
  { id: "smiles-people", label: "Smiles & people", navSymbol: "☺", symbols: symbols(`
😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👽 👾 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾
👋 🤚 🖐️ ✋ 🖖 👌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🦷 🦴 👀 👁️ 👅 👄 💋
👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 🙍 🙎 🙅 🙆 💁 🙋 🧏 🙇 🤦 🤷 👮 👷 💂 🕵️ 👩‍⚕️ 👨‍🌾 👨‍🍳 👨‍🎓 👨‍🎤 👨‍🏫 👨‍🏭 👨‍💻 👨‍💼 👨‍🔧 👨‍🔬 👨‍🎨 👨‍🚒 👨‍✈️ 👨‍🚀 👨‍⚖️
`) },
  { id: "animals-nature", label: "Animals & nature", navSymbol: "🕊", symbols: symbols(`
🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐽 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🪲 🪳 🦟 🦗 🕷️ 🕸️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐕‍🦺 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿️ 🦔
🌵 🎄 🌲 🌳 🌴 🪵 🌱 🌿 ☘️ 🍀 🎍 🪴 🎋 🍃 🍂 🍁 🍄 🐚 🌾 💐 🌷 🌹 🥀 🌺 🌸 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 🌎 🌍 🌏 🪐 💫 ⭐ 🌟 ✨ ⚡ ☄️ 💥 🔥 🌪️ 🌈 ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️ 🌩️ 🌨️ ❄️ ☃️ ⛄ 💨 💧 💦 ☔ ☂️ 🌊
`) },
  { id: "food-drink", label: "Food & drink", navSymbol: "🍜", symbols: symbols(`
🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯
🥛 🍼 ☕ 🫖 🍵 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🍾 🧊 🥄 🍴 🍽️ 🥣 🥡 🥢 🧂
`) },
  { id: "activities", label: "Activities", navSymbol: "🏀", symbols: symbols(`
⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 🪃 🥅 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🩰 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🪗 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩
`) },
  { id: "travel-places", label: "Travel & places", navSymbol: "🚀", symbols: symbols(`
🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🦯 🦽 🦼 🛴 🚲 🛵 🏍️ 🛺 🚨 🚔 🚍 🚘 🚖 🚡 🚠 🚟 🚃 🚋 🚞 🚝 🚄 🚅 🚈 🚂 🚆 🚇 🚊 🚉 ✈️ 🛫 🛬 🛩️ 💺 🛰️ 🚀 🛸 🚁 🛶 ⛵ 🚤 🛥️ 🛳️ ⛴️ 🚢 ⚓ 🪝 ⛽ 🚧 🚦 🚥 🗺️ 🗿 🗽 🗼 🏰 🏯 🏟️ 🎡 🎢 🎠 ⛲ ⛱️ 🏖️ 🏝️ 🏜️ 🌋 ⛰️ 🏔️ 🗻 🏕️ ⛺ 🛖 🏠 🏡 🏢 🏥 🏦 🏨 🏪 🏫 🏬 🏭 🏛️ ⛪ 🕌 🛕 🕍 ⛩️ 🕋 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎑 🏞️
`) },
  { id: "objects", label: "Objects", navSymbol: "💡", symbols: symbols(`
⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 🕹️ 🗜️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ 🎚️ 🎛️ 🧭 ⏱️ ⏲️ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🔌 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 🪙 💰 💳 💎 ⚖️ 🪜 🧰 🪛 🔧 🔨 ⚒️ 🛠️ ⛏️ 🪚 🔩 ⚙️ 🪤 🧱 ⛓️ 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🪦 ⚱️ 🏺 🔮 📿 🧿 💈 ⚗️ 🔭 🔬 🕳️ 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🪠 🧺 🧻 🚽 🚰 🚿 🛁 🛀 🧼 🪥 🪒 🧽 🪣 🧴 🔑 🗝️ 🚪 🪑 🛋️ 🛏️ 🛌 🧸 🪆 🖼️ 🪞 🪟 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🎊 🎉
`) },
  { id: "symbols", label: "Symbols", navSymbol: "♡", symbols: symbols(`
❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 〽️ ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🈳 🈂️ 🛂 🛃 🛄 🛅 🚹 🚺 🚼 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🆖 🆗 🆙 🆒 🆕 🆓 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔢 #️⃣ *️⃣ ⏏️ ▶️ ⏸️ ⏯️ ⏹️ ⏺️ ⏭️ ⏮️ ⏩ ⏪ 🔀 🔁 🔂 ◀️ 🔼 🔽 ⏫ ⏬ ➡️ ⬅️ ⬆️ ⬇️ ↗️ ↘️ ↙️ ↖️ ↕️ ↔️ 🔄 ↪️ ↩️ 🔃
`) },
  { id: "flags", label: "Flags", navSymbol: "⚑", symbols: symbols(`
🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🇺🇳 🇧🇯 🇨🇮 🇸🇳 🇹🇬 🇬🇭 🇳🇬 🇿🇦 🇰🇪 🇲🇦 🇩🇿 🇹🇳 🇪🇬 🇪🇹 🇨🇲 🇬🇦 🇨🇩 🇨🇬 🇷🇼 🇺🇬 🇹🇿 🇦🇴 🇲🇿 🇲🇬 🇲🇺 🇸🇨 🇨🇻 🇬🇲 🇬🇳 🇬🇼 🇱🇷 🇸🇱 🇲🇱 🇧🇫 🇳🇪 🇹🇩 🇨🇫 🇬🇶 🇸🇹 🇺🇸 🇨🇦 🇲🇽 🇧🇷 🇦🇷 🇨🇱 🇨🇴 🇵🇪 🇬🇧 🇫🇷 🇩🇪 🇮🇹 🇪🇸 🇵🇹 🇳🇱 🇧🇪 🇨🇭 🇦🇹 🇸🇪 🇳🇴 🇩🇰 🇫🇮 🇵🇱 🇺🇦 🇬🇷 🇹🇷 🇮🇳 🇨🇳 🇯🇵 🇰🇷 🇸🇬 🇦🇪 🇸🇦 🇮🇱 🇦🇺 🇳🇿
`) },
];

export const STICKER_SYMBOLS = symbols(`
🟢 🔴 🟡 🔵 🟣 🟠 ⚫ ⚪ 🟤 🔺 🔻 🔸 🔹 🔶 🔷 🔳 🔲 ⬆️ ⬇️ ➡️ ⬅️ ↗️ ↘️ ↙️ ↖️ ⤴️ ⤵️ 🔃 🔄 🔁 🔀 💎 🏆 🥇 🥈 🥉 🏅 🎖️ 👑 💯 🚀 ⚡ 🔥 💥 ✨ ⭐ 🌟 🎯 📈 📉 💰 💵 🪙 💳 🧠 👀 💡 📌 📍 🚩 🏁 🛑 ⚠️ ✅ ❌ ❤️ 💚 💙 💜 🖤 🤍 💔 💖 💘 💝 🤝 🙌 👏 👍 👎 ✊ 💪 🔔 🔕 📣 📢 🎉 🎊 🎁 🧲 🔒 🔓 👁️ 🕒 ⏰ ⏳ 🧭 🔍 🔎
`);

export const ICON_SYMBOLS = symbols(`
＋ − × ÷ = ≠ ≈ ± ∞ √ ∑ ∆ ∇ ∂ % ‰ ✓ ✔ ✕ ✖ ! ? ‼ ⁉ ★ ☆ ◆ ◇ ● ○ ▲ △ ▼ ▽ ■ □ ▶ ◀ ↑ ↓ → ← ↗ ↘ ↙ ↖ ↔ ↕ ⇧ ⇩ ⇨ ⇦ ⟲ ⟳ ⌂ ☰ ☷ ☑ ☒ ☀ ☁ ☂ ☃ ☄ ☎ ☏ ☕ ☘ ☠ ☢ ☣ ♠ ♣ ♥ ♦ ♤ ♧ ♡ ♢ ♪ ♫ ♬ ⚑ ⚐ ⚙ ⚡ ⚓ ⚖ ⚗ ⚛ ⊕ ⊖ ⊗ ⊙ ⊥ ∥ ∠ ≡ ≤ ≥ ≪ ≫ ∧ ∨ ∩ ∪ ∈ ∉ ⊂ ⊃
`);

export const ICON_FAMILY_LABELS: Record<DrawingIconFamily, string> = { emojis: "Emojis", stickers: "Stickers", icons: "Icons" };

export const getDrawingIconFamilyCount = (family: DrawingIconFamily): number => {
  if (family === "emojis") return EMOJI_CATEGORIES.reduce((total, category) => total + category.symbols.length, 0);
  return family === "stickers" ? STICKER_SYMBOLS.length : ICON_SYMBOLS.length;
};
