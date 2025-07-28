import { container } from '../container';

const adStore = container.adStore;

export async function getDailyReport() {
  const allAds = await adStore.getAll('ads');
  const today = new Date();

  return allAds.map(ad => {
    const viewsArr = Array.isArray(ad.views) ? ad.views : [];
    const lastView = viewsArr[viewsArr.length - 1];
    const beforeLastView = viewsArr[viewsArr.length - 2];

    let todayViews = 0;
    if (lastView) {
      const lastDate = new Date(lastView.timestamp);
      if (
        lastDate.getFullYear() === today.getFullYear() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getDate() === today.getDate()
      ) {
        todayViews = lastView.count - (beforeLastView ? beforeLastView.count : 0);
      }
    }

    return {
      title: ad.title,
      totalViews: lastView ? lastView.count : 0,
      todayViews,
    };
  });
}