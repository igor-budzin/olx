import { container } from '../container';
import { AdData } from '../types';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { format } from "date-fns";
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Or more explicit registration
Chart.register(ChartDataLabels);

const chartCallback = (ChartJS) => {
  
};

// Increase size and add device pixel ratio for higher resolution
const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
  width: 400, 
  height: 200, 
  backgroundColour: 'white',
  chartCallback
});

async function getGraphImage(labels: string[], counts: number[]) {
  const configuration: ChartConfiguration = {
    type: 'line',
    plugins: [ChartDataLabels], // Add plugin directly here
    data: {
      labels: labels,
      datasets: [{
        label: 'Перегляди оголошень',
        data: counts,
        fill: false,
        tension: 0.1,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        pointStyle: 'circle',
        pointRadius: 6,
        pointHoverRadius: 8,
        borderWidth: 3,          // Thicker line
        pointBorderWidth: 2,     // Better point border
        pointBackgroundColor: 'white', // White center in points
      }]
    },
    options: {
      devicePixelRatio: 2,
      scales: {
        y: {
          max: Math.max(...counts) * 1.2, // Add 20% padding above max value
          min: Math.min(...counts) - Math.max(Math.min(...counts) * 0.2, 2), // 20% less than minimum value, can go below zero
          beginAtZero: false, // Allow custom min value
          ticks: {
            precision: 0 // Show integers only
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Статистика переглядів',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        datalabels: {
          align: 'top',
          anchor: 'end',
          color: '#000000',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value) => value.toString(),
          padding: 6,
          backgroundColor: function(context) {
            return 'rgba(255, 255, 255, 0.7)';
          },
          borderRadius: 4,
          display: true
        },
        legend: {
          display: false,
        }
      },
    }
  };


  const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration, 'image/png');
  return imageBuffer;
}

export async function generateDaylyChart(views: AdData['views'] = []) {
  const users = await container.userRepository.getAllActiveUsers();

  for (const user of users) {
    const allAds = await container.adRepository.getAdsByOwnerId(user.id);
    const today = new Date();

    for (const ad of allAds) {
      const viewsArr = Array.isArray(ad.views) ? ad.views : [];

      const dateLabels: string[] = [];
      const viewCounts: number[] = [];

      const PERIOD_DAYS = 5; // Number of days to show in the chart

      for (let i = 1; i <= PERIOD_DAYS; i++) {
        const dateLabel = format(viewsArr.at(i * -1).timestamp, 'E dd.MM')
        dateLabels.push(dateLabel);

        const totalViewsOnDayAtIndex = viewsArr.at(i * -1).count;
        const totalViewsBeforeDayAtIndex = viewsArr.at(i * -1 - 1).count;
        const viewsOnDay = totalViewsOnDayAtIndex - totalViewsBeforeDayAtIndex;        
        
        // console.log(`${ad.title} - ${dateLabel}: ${viewsOnDay} views`);
        // console.log(totalViewsOnDayAtIndex, totalViewsBeforeDayAtIndex, viewsOnDay);
        // console.log('--------------------------------')
        viewCounts.push(viewsOnDay);
      }

      viewCounts.reverse();
      dateLabels.reverse();
      const imageBuffer = await getGraphImage(dateLabels, viewCounts);
      const todayViews = viewCounts.at(-1);
      const totalViews = ad.views.at(-1).count;

      const imageCaption = `${ad.title}\n\nПереглядів за сьогодні: ${todayViews}\nВсього переглядів: ${totalViews}`;
      await container.notifications.sendImage(ad.ownerId, imageBuffer, imageCaption);
    }
  }
}