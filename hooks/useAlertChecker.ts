import { useEffect } from 'react';
import { usePriceStore } from '../store/usePriceStore';
import { useAlertStore } from '../store/useAlertStore';
import { sendPriceAlert } from '../services/notifications';

export function useAlertChecker() {
  const prices = usePriceStore(state => state.prices);
  const { alerts, markTriggered } = useAlertStore();

  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;

    alerts.forEach(alert => {
      if (alert.triggered) return;

      const coinPrice = prices[alert.coinId]?.current_price;
      if (coinPrice === undefined) return;

      const shouldTrigger =
        (alert.direction === 'above' && coinPrice >= alert.targetPrice) ||
        (alert.direction === 'below' && coinPrice <= alert.targetPrice);

      if (shouldTrigger) {
        sendPriceAlert(alert.coinName, coinPrice, alert.targetPrice, alert.direction);
        markTriggered(alert.id);
      }
    });
  }, [prices]); // runs every time prices update
}