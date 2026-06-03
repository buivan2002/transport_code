import { Module, OnModuleInit } from '@nestjs/common';
import { CarrierRegistry } from './carriers/carrier-registry';
import { GhtkTrackingProvider } from './carriers/ghtk-tracking.provider';
import { JtHybridProvider } from './carriers/jt-hybrid.provider';
import { SpxHybridProvider } from './carriers/spx-hybrid.provider';
import { JtTramavandonSource } from './sources/jt-tramavandon.source';
import { SpxTramavandonSource } from './sources/spx-tramavandon.source';
import { SpxVnPublicSource } from './sources/spx-vn-public.source';
import { TrackingController } from './tracking.controller';
import { TrackingCacheService } from './tracking-cache.service';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [TrackingController],
  providers: [
    TrackingService,
    TrackingCacheService,
    CarrierRegistry,
    GhtkTrackingProvider,
    SpxHybridProvider,
    JtHybridProvider,
    SpxVnPublicSource,
    SpxTramavandonSource,
    JtTramavandonSource,
  ],
})
export class TrackingModule implements OnModuleInit {
  constructor(
    private carrierRegistry: CarrierRegistry,
    private ghtkTrackingProvider: GhtkTrackingProvider,
    private spxHybridProvider: SpxHybridProvider,
    private jtHybridProvider: JtHybridProvider,
  ) {}

  onModuleInit() {
    this.carrierRegistry.register([
      this.ghtkTrackingProvider,
      this.spxHybridProvider,
      this.jtHybridProvider,
    ]);
  }
}
