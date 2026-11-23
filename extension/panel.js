const inputs = document.querySelectorAll('input[type="checkbox"]');
const status = document.querySelector("#status");

MyTube.observe(values => {
  for (const input of inputs) input.checked = values[input.name];
  for (const group of document.querySelectorAll("fieldset")) group.disabled = false;
}).catch(() => { status.textContent = "Settings could not be loaded. Reopen MyTube to retry."; });

for (const input of inputs) {
  input.addEventListener("change", async () => {
    const checked = input.checked;
    input.disabled = true;
    try {
      await chrome.storage.local.set({ [input.name]: checked });
      status.textContent = "";
    } catch {
      input.checked = !checked;
      status.textContent = "Could not save this change. Try again.";
    } finally {
      input.disabled = false;
    }
  });
}
