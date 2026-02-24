import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    // Detect window host to allow access from other devices in the same network
    const host = window.location.hostname;

    // In production, you can set a specific URL, otherwise it defaults to the current host
    // To use a specific production URL, change 'http://${host}:3000/api' to your Vercel URL
    this.baseUrl = `https://sistema-ventas-backend-8mndjztpk-iscrobertorojas-4991s-projects.vercel.app/api`;
  }

  // Clients
  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/clients`);
  }

  createClient(client: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clients`, client);
  }

  updateClient(client: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/clients`, client);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/clients`, { params: { id: id.toString() } });
  }

  // Services
  getServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/services`);
  }

  createService(service: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/services`, service);
  }

  // Sales
  getSales(startDate?: string, endDate?: string, clientId?: number): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.http.get<any[]>(`${this.baseUrl}/sales`, { params });
  }

  createSale(sale: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/sales`, sale);
  }

  updateSale(sale: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/sales`, sale);
  }

  getSaleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sales/${id}`);
  }

  // Payments
  getPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/payments`);
  }

  registerPayment(payment: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payments`, payment);
  }

  // Reports
  getDetailedReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/reports/detailed`);
  }

  // Stats
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }

  // Settings
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/settings`);
  }

  updateSetting(setting_key: string, setting_value: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/settings`, { setting_key, setting_value });
  }

  deletePayment(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/payments`, { params: { id: id.toString() } });
  }

  updatePayment(payment: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/payments`, payment);
  }

  // Service Policies
  getServicePolicies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/service-policies`);
  }

  getServicePolicyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/service-policies/${id}`);
  }

  createServicePolicy(policy: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/service-policies`, policy);
  }

  updateServicePolicy(policy: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/service-policies`, policy);
  }

  deleteServicePolicy(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/service-policies`, { params: { id: id.toString() } });
  }

  // Policy Records
  getPolicyRecords(policyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/policy-records`, { params: { policy_id: policyId.toString() } });
  }

  createPolicyRecord(record: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/policy-records`, record);
  }

  updatePolicyRecord(record: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/policy-records`, record);
  }

  deletePolicyRecord(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/policy-records`, { params: { id: id.toString() } });
  }

  // Database Management
  backupDatabase(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/database/backup`, { responseType: 'blob' });
  }

  restoreDatabase(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/database/restore`, formData);
  }
}
