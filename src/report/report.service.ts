import { TYPES } from '../inversify.types';
import { UserRepository } from '../user/user.repository';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { format } from "date-fns";
import { Chart, ChartConfiguration } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { inject, injectable } from 'inversify';
import { AdRepository } from '../ads/ads.repository';
import { Notification } from '../notifications/Notification';
import { locationFormatter } from '../utils/location.formatter';

@injectable()
export class ReportService {
  private chartJSNodeCanvas: ChartJSNodeCanvas;

  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository,
    @inject(TYPES.AdRepository) private adRepository: AdRepository,
    @inject(TYPES.NotificationService) private notificationService: Notification
  ) {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({
      chartCallback: (ChartJS) => {
      },
      width: 400,
      height: 250,
      backgroundColour: 'white',
    });
  }

  /**
   * Generate chart image from labels and data points
   */
  async getGraphImage(labels: string[], counts: number[], title: string): Promise<Buffer> {
    const configuration: ChartConfiguration = {
      type: 'line',
      plugins: [ChartDataLabels],
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
          borderWidth: 3,
          pointBorderWidth: 2,
          pointBackgroundColor: 'white',
        }]
      },
      options: {
        devicePixelRatio: 2,
        scales: {
          y: {
            max: Math.floor(Math.max(...counts) * 1.4), // Add 40% padding above max value
            min: Math.floor(Math.min(...counts) - Math.max(Math.min(...counts) * 0.2, 2)), // 20% less than minimum value, can go below zero
            beginAtZero: false, // Allow custom min value
            ticks: {
              precision: 0 // Show integers only
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: `Статистика переглядів\n${title}`,
            padding: {
              top: 10,
              bottom: 40,
            },
            align: 'center',
            font: {
              size: 16,
              weight: 'bold',
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
            backgroundColor: function (context) {
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

    const imageBuffer = await this.chartJSNodeCanvas.renderToBuffer(configuration, 'image/png');
    return imageBuffer;
  }

  /**
   * Generate and send daily chart reports to all active users
   */
  async generateDailyChart(): Promise<void> {
    const users = await this.userRepository.getAllActiveUsers();

    for (const user of users) {
      const allAds = await this.adRepository.getAdsByOwnerId(user.id);

      const totalViews = allAds.reduce((sum, ad) => sum += ad.views.at(-1)?.count, 0);
      const totalViewsOnToday = allAds.reduce((sum, ad) => {
        return sum += ad.views.at(-1).viewOnDay;
      }, 0);
      const adCount = allAds.length;

      this.notificationService.sendMessage(user.id, {
        message: `Щоденний звіт (${format(new Date(), 'EEEE dd.MM.yyyy')})\n\nУ вас ${adCount} оголошення\nПереглядів за сьогодні: ${totalViewsOnToday}\nПереглядів за весь час: ${totalViews}`
      });

      for (const ad of allAds) {
        const viewsArr = Array.isArray(ad.views) ? ad.views : [];

        if (ad.views.length < 2) {
          const text = `<b>${ad.title}</b>\n${locationFormatter(ad.location)}\n\nЗамало даних для статистики`;
          await this.notificationService.sendMessage(user.id, {
            message: text
          });
          continue;
        }

        const dateLabels: string[] = [];
        const viewCounts: number[] = [];

        const PERIOD_DAYS = 5; // Number of days to show in the chart

        for (let i = 1; i <= PERIOD_DAYS; i++) {
          const dateLabel = format(viewsArr.at(i * -1).timestamp, 'E dd.MM')
          dateLabels.push(dateLabel);
          const viewsOnDay = viewsArr.at(i * -1).viewOnDay;
          viewCounts.push(viewsOnDay);
        }

        viewCounts.reverse();
        dateLabels.reverse();
        const imageBuffer = await this.getGraphImage(dateLabels, viewCounts, ad.title);
        const todayViews = ad.views.at(-1).viewOnDay;
        const totalViews = ad.views.at(-1).count;

        const imageCaption = `<b>${ad.title}</b>\n${locationFormatter(ad.location)}\n\nПереглядів за сьогодні: ${todayViews}\nВсього переглядів: ${totalViews}`;
        await this.notificationService.sendImage(user.id, imageBuffer, imageCaption);
      }
    }
  }
}
