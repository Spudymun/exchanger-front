'use client';

import { ExchangeRates } from '../../../src/components/ExchangeRates';
import { OrderStatus } from '../../../src/components/OrderStatus';

export default function TRPCDemoPage() {
  return (
    <div className="min-h-screen p-5 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">tRPC Integration Demo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exchange Rates Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Exchange Rates</h2>
            <ExchangeRates />
          </div>

          {/* Order Status Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Order Status</h2>
            <OrderStatus orderId="demo-order-123" />
          </div>
        </div>
      </div>
    </div>
  );
}
