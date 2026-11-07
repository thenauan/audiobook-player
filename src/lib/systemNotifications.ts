// Notificações do sistema (navegador, atalho na tela de início e app de computador). São geradas pelo próprio app,
// enquanto ele está em execução, inclusive em segundo plano tocando áudio. No iPhone só existem no app instalado na
// tela de início (iOS 16.4 ou mais novo).
export type NotificationPermissionState = NotificationPermission | 'unsupported';

const ICON = './icons/app-icon-192.png';

export function getNotificationPermission(): NotificationPermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

// Precisa ser chamada direto do toque na chave: o iPhone recusa o pedido fora de um gesto
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function showSystemNotification(title: string, body: string) {
  if (getNotificationPermission() !== 'granted') return;
  const options: NotificationOptions = { body, icon: ICON, badge: ICON };
  try {
    // Celular só aceita notificação pelo service worker; o app de computador não tem um
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options);
  } catch (err) {
    console.warn('Notificação do sistema não enviada:', err);
  }
}

// Respeita a chave geral e a do tipo de aviso nos ajustes
export function notifySystem(prefKey: string, title: string, body: string) {
  try {
    if (localStorage.getItem('app_notifications_enabled') === 'false' || localStorage.getItem(prefKey) === 'false') return;
  } catch {}
  void showSystemNotification(title, body);
}
