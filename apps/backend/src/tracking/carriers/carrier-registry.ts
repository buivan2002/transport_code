import { Injectable, NotFoundException } from '@nestjs/common';
import { CarrierCode } from '../enums/carrier-code.enum';
import { CarrierStrategy } from './carrier-strategy.interface';

@Injectable()
export class CarrierRegistry {
  private providers = new Map<CarrierCode, CarrierStrategy>();

  register(strategies: CarrierStrategy[]) {
    for (const strategy of strategies) {
      this.providers.set(strategy.carrier, strategy);
    }
  }

  get(carrier: CarrierCode): CarrierStrategy {
    const provider = this.providers.get(carrier);

    if (!provider || !provider.isEnabled()) {
      throw new NotFoundException({
        error: {
          code: 'CARRIER_NOT_SUPPORTED',
          message: 'Nhà vận chuyển chưa được hỗ trợ',
          carrier,
        },
      });
    }

    return provider;
  }

  listEnabled() {
    return [...this.providers.values()]
      .filter((provider) => provider.isEnabled())
      .map((provider) => ({
        code: provider.carrier,
        name: provider.name,
      }));
  }
}
