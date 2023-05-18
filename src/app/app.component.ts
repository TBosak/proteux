import { Component, OnInit, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Papa from 'papaparse';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements  OnInit {
  title = 'app';
  site = new FormControl('');
  response = signal([] as any[]);

  ngOnInit(): void {
    this.site.valueChanges.subscribe((value) => {
      if (value){
        // axios.get(value).then((res) => {
        // });
      }
    });
  }

  process(event: any){
    const target= event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    file.text().then((text) => {
      console.log(Papa.parse(text, {header:true}).data);
      this.response.set(Papa.parse(text, {header:true}).data);
    });
  }

  keys(obj: any){
    return Object.keys(obj);
  }
}
