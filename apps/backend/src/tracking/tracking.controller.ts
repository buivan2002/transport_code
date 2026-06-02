import { Body, Controller, Get, Post } from '@nestjs/common';
import { SearchTrackingRequestDto } from './dto/search-tracking.request.dto';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private trackingService: TrackingService) {}

  @Get('carriers')
  getCarriers() {
    return this.trackingService.getCarriers();
  }

  @Post('search')
  search(@Body() body: SearchTrackingRequestDto) {
    return this.trackingService.search(body);
  }
}
