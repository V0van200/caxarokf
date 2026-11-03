async function start() {
  try {
    const response = await fetch('./data/rita.json');
    if (!response.ok) throw new Error('Data unavailable');
    const data = await response.json();
    const view = {
      ...data,
      created_label: new Intl.DateTimeFormat('ru-RU', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'}).format(new Date(data.channel_created)),
      followers_label: new Intl.NumberFormat('ru-RU').format(data.stats.followers),
      goal_label: new Intl.NumberFormat('ru-RU').format(data.stats.followers_goal),
      remaining: Math.max(0, data.stats.followers_goal - data.stats.followers)
    };
    const resolve = value => value.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
      const result = path.split('.').reduce((obj, key) => obj?.[key], view);
      if (result === undefined) throw new Error('Missing data: ' + path);
      return String(result);
    });
    const fragment = document.getElementById('page-template').content.cloneNode(true);
    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) walker.currentNode.textContent = resolve(walker.currentNode.textContent);
    fragment.querySelectorAll('*').forEach(element => {
      [...element.attributes].forEach(attr => {
        const value = resolve(attr.value);
        if (attr.name === 'href' && !value.startsWith('#') && !value.startsWith('https://')) throw new Error('Invalid link');
        element.setAttribute(attr.name, value);
      });
    });
    document.getElementById('app').append(fragment);
    document.dispatchEvent(new Event('site-ready'));
    document.title = `Рита (${data.nick}) — фан-страница`;
    document.getElementById('year').textContent = new Date().getFullYear();
    let toastTimer;
    function showMessage(message) {
      const toast = document.querySelector('.toast');
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    }
    document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        showMessage('Скопировано: ' + button.dataset.copy);
      } catch {
        showMessage('Скопируйте вручную: ' + button.dataset.copy);
      }
    }));
    document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
      document.querySelectorAll('nav a').forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    }));
  } catch (error) {
    document.getElementById('load-error').hidden = false;
    console.error(error);
  }
}
start();
