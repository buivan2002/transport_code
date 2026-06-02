import { Module, OnModuleInit } from '@nestjs/common';
import { CarrierRegistry } from './carriers/carrier-registry';
import { GhtkTrackingProvider } from './carriers/ghtk-tracking.provider';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [TrackingController],
  providers: [TrackingService, CarrierRegistry, GhtkTrackingProvider],
})
export class TrackingModule implements OnModuleInit {
  constructor(
    private carrierRegistry: CarrierRegistry,
    private ghtkTrackingProvider: GhtkTrackingProvider,
  ) {}

  onModuleInit() {
    this.carrierRegistry.register([this.ghtkTrackingProvider]);
  }
}
