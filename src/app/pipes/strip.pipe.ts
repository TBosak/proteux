import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'strip'
})
export class StripPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return value.type === 'string' ? value?.replaceAll(args, '') : value;
  }

}
