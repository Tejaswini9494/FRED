import { 
  users, type User, type InsertUser,
  indicators, type Indicator, type InsertIndicator,
  values, type Value, type InsertValue,
  etlJobs, type EtlJob, type InsertEtlJob,
  analysisResults, type AnalysisResult, type InsertAnalysisResult
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Indicator methods
  getIndicators(): Promise<Indicator[]>;
  getIndicator(id: number): Promise<Indicator | undefined>;
  getIndicatorBySymbol(symbol: string): Promise<Indicator | undefined>;
  createIndicator(indicator: InsertIndicator): Promise<Indicator>;
  updateIndicator(id: number, indicator: Partial<InsertIndicator>): Promise<Indicator | undefined>;
  
  // Values methods
  getValues(indicatorId: number, startDate?: Date, endDate?: Date): Promise<Value[]>;
  createValue(value: InsertValue): Promise<Value>;
  bulkCreateValues(values: InsertValue[]): Promise<Value[]>;
  
  // ETL Job methods
  getEtlJobs(limit?: number): Promise<EtlJob[]>;
  getEtlJob(id: number): Promise<EtlJob | undefined>;
  createEtlJob(job: InsertEtlJob): Promise<EtlJob>;
  updateEtlJob(id: number, job: Partial<InsertEtlJob>): Promise<EtlJob | undefined>;
  
  // Analysis Result methods
  getAnalysisResults(type?: string): Promise<AnalysisResult[]>;
  getAnalysisResult(id: number): Promise<AnalysisResult | undefined>;
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private indicators: Map<number, Indicator>;
  private values: Map<number, Value>;
  private etlJobs: Map<number, EtlJob>;
  private analysisResults: Map<number, AnalysisResult>;
  
  private userCurrentId: number;
  private indicatorCurrentId: number;
  private valueCurrentId: number;
  private etlJobCurrentId: number;
  private analysisResultCurrentId: number;

  constructor() {
    this.users = new Map();
    this.indicators = new Map();
    this.values = new Map();
    this.etlJobs = new Map();
    this.analysisResults = new Map();
    
    this.userCurrentId = 1;
    this.indicatorCurrentId = 1;
    this.valueCurrentId = 1;
    this.etlJobCurrentId = 1;
    this.analysisResultCurrentId = 1;
    
    // Initialize with some sample indicators
    this.createIndicator({
      symbol: "GDP",
      name: "Gross Domestic Product",
      description: "Quarterly measure of US economic output",
      frequency: "quarterly",
      units: "billions_usd",
      source: "FRED",
      lastUpdated: new Date()
    });
    
    this.createIndicator({
      symbol: "UNRATE",
      name: "Unemployment Rate",
      description: "Monthly unemployment rate in the US",
      frequency: "monthly",
      units: "percent",
      source: "FRED",
      lastUpdated: new Date()
    });
    
    this.createIndicator({
      symbol: "CPIAUCSL",
      name: "Consumer Price Index",
      description: "Monthly consumer price index for all urban consumers",
      frequency: "monthly",
      units: "index",
      source: "FRED",
      lastUpdated: new Date()
    });
    
    // Add sample ETL jobs
    this.createEtlJob({
      task: "GDP Dataset Update",
      status: "completed",
      startTime: new Date(Date.now() - 35000),  // 35 seconds ago
      endTime: new Date(),
      recordsProcessed: 125,
      error: null,
      metadata: null
    });
    
    this.createEtlJob({
      task: "CPI Dataset Update",
      status: "completed",
      startTime: new Date(Date.now() - 28000),  // 28 seconds ago
      endTime: new Date(),
      recordsProcessed: 87,
      error: null,
      metadata: null
    });
    
    this.createEtlJob({
      task: "Unemployment Data",
      status: "in_progress",
      startTime: new Date(),
      endTime: null,
      recordsProcessed: null,
      error: null,
      metadata: null
    });
    
    this.createEtlJob({
      task: "S&P 500 Daily Update",
      status: "scheduled",
      startTime: new Date(new Date().setHours(16, 0, 0, 0)),  // Today at 4 PM
      endTime: null,
      recordsProcessed: null,
      error: null,
      metadata: null
    });
    
    this.createEtlJob({
      task: "Treasury Yield Update",
      status: "scheduled",
      startTime: new Date(new Date().setHours(17, 0, 0, 0)),  // Today at 5 PM
      endTime: null,
      recordsProcessed: null,
      error: null,
      metadata: null
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Indicator methods
  async getIndicators(): Promise<Indicator[]> {
    return Array.from(this.indicators.values());
  }
  
  async getIndicator(id: number): Promise<Indicator | undefined> {
    return this.indicators.get(id);
  }
  
  async getIndicatorBySymbol(symbol: string): Promise<Indicator | undefined> {
    return Array.from(this.indicators.values()).find(
      (indicator) => indicator.symbol === symbol
    );
  }
  
  async createIndicator(insertIndicator: InsertIndicator): Promise<Indicator> {
    const id = this.indicatorCurrentId++;
    const indicator: Indicator = { ...insertIndicator, id };
    this.indicators.set(id, indicator);
    return indicator;
  }
  
  async updateIndicator(id: number, indicatorUpdate: Partial<InsertIndicator>): Promise<Indicator | undefined> {
    const indicator = this.indicators.get(id);
    if (!indicator) return undefined;
    
    const updatedIndicator: Indicator = { ...indicator, ...indicatorUpdate };
    this.indicators.set(id, updatedIndicator);
    return updatedIndicator;
  }
  
  // Values methods
  async getValues(indicatorId: number, startDate?: Date, endDate?: Date): Promise<Value[]> {
    let values = Array.from(this.values.values()).filter(
      (value) => value.indicatorId === indicatorId
    );
    
    if (startDate) {
      values = values.filter(value => value.date >= startDate);
    }
    
    if (endDate) {
      values = values.filter(value => value.date <= endDate);
    }
    
    return values.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async createValue(insertValue: InsertValue): Promise<Value> {
    const id = this.valueCurrentId++;
    const value: Value = { ...insertValue, id };
    this.values.set(id, value);
    return value;
  }
  
  async bulkCreateValues(insertValues: InsertValue[]): Promise<Value[]> {
    const createdValues: Value[] = [];
    
    for (const insertValue of insertValues) {
      const id = this.valueCurrentId++;
      const value: Value = { ...insertValue, id };
      this.values.set(id, value);
      createdValues.push(value);
    }
    
    return createdValues;
  }
  
  // ETL Job methods
  async getEtlJobs(limit?: number): Promise<EtlJob[]> {
    const jobs = Array.from(this.etlJobs.values())
      .sort((a, b) => {
        if (a.startTime && b.startTime) {
          return b.startTime.getTime() - a.startTime.getTime();
        }
        return 0;
      });
    
    return limit ? jobs.slice(0, limit) : jobs;
  }
  
  async getEtlJob(id: number): Promise<EtlJob | undefined> {
    return this.etlJobs.get(id);
  }
  
  async createEtlJob(insertJob: InsertEtlJob): Promise<EtlJob> {
    const id = this.etlJobCurrentId++;
    const job: EtlJob = { ...insertJob, id };
    this.etlJobs.set(id, job);
    return job;
  }
  
  async updateEtlJob(id: number, jobUpdate: Partial<InsertEtlJob>): Promise<EtlJob | undefined> {
    const job = this.etlJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob: EtlJob = { ...job, ...jobUpdate };
    this.etlJobs.set(id, updatedJob);
    return updatedJob;
  }
  
  // Analysis Result methods
  async getAnalysisResults(type?: string): Promise<AnalysisResult[]> {
    let results = Array.from(this.analysisResults.values());
    
    if (type) {
      results = results.filter(result => result.type === type);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getAnalysisResult(id: number): Promise<AnalysisResult | undefined> {
    return this.analysisResults.get(id);
  }
  
  async createAnalysisResult(insertResult: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = this.analysisResultCurrentId++;
    const result: AnalysisResult = { ...insertResult, id };
    this.analysisResults.set(id, result);
    return result;
  }
}

export const storage = new MemStorage();
