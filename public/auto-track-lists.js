const t = TrelloPowerUp.iframe();
let selected = [];

async function loadLists() {
  const board = await t.board("lists");
  const saved = await t.get("board", "shared", "autoTrackLists");

  selected = saved || [];

  const container = document.getElementById("listContainer");
  container.innerHTML = "";

  board.lists.forEach(list => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.dataset.name = list.name;

    if (selected.includes(list.name)) {
      div.classList.add("selected");
      div.innerHTML = `<span>${list.name}</span><span class="checkmark">✔</span>`;
    } else {
      div.innerHTML = `<span>${list.name}</span>`;
    }

    div.onclick = () => toggleSelect(div, list.name);
    container.appendChild(div);
  });

  setTimeout(() => t.sizeTo(document.body).done(), 40);
}

function toggleSelect(el, name) {
  const index = selected.indexOf(name);

  if (index === -1) {
    selected.push(name);
    el.classList.add("selected");
    el.innerHTML = `<span>${name}</span><span class="checkmark">✔</span>`;
  } else {
    selected.splice(index, 1);
    el.classList.remove("selected");
    el.innerHTML = `<span>${name}</span>`;
  }
}

document.getElementById("saveBtn").onclick = async () => {
  await t.set("board", "shared", "autoTrackLists", selected);
  t.closePopup({ selectedLists: selected });
};

loadLists();
