import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../logger/logger.js';

const FILE_NAME = 'costTracking.js';

// Configure AWS clients with v3
const ceClient = new CostExplorerClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'ap-south-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'bedrock_usage';
const SOCIAL_LENS_TABLE = process.env.SOCIAL_LENS_TABLE || 'Social_Lens';

// Helper function to extract table name from ARN
function getTableName(tableIdentifier) {
    if (tableIdentifier && tableIdentifier.includes('/')) {
        return tableIdentifier.split('/').pop();
    }
    return tableIdentifier;
}

async function getServiceCosts(start, end, services) {
    try {
        const command1 = new GetCostAndUsageCommand({
            TimePeriod: { Start: start, End: end },
            Granularity: 'DAILY',
            Metrics: ['UnblendedCost'],
            Filter: { Dimensions: { Key: 'SERVICE', Values: services } },
            GroupBy: [
                { Type: 'DIMENSION', Key: 'SERVICE' },
                { Type: 'DIMENSION', Key: 'USAGE_TYPE' }
            ]
        });

        const command2 = new GetCostAndUsageCommand({
            TimePeriod: { Start: start, End: end },
            Granularity: 'DAILY',
            Metrics: ['UnblendedCost'],
            Filter: { Dimensions: { Key: 'SERVICE', Values: services } },
            GroupBy: [
                { Type: 'DIMENSION', Key: 'SERVICE' },
                { Type: 'DIMENSION', Key: 'REGION' }
            ]
        });

        const [response1, response2] = await Promise.all([
            ceClient.send(command1),
            ceClient.send(command2)
        ]);

        const dailyCosts = {};
        const usageTypeData = {};
        const regionData = {};

        // Process usage type data
        response1.ResultsByTime.forEach(result => {
            const date = result.TimePeriod.Start;
            if (!usageTypeData[date]) usageTypeData[date] = {};
            
            result.Groups.forEach(group => {
                const [service, usageType] = group.Keys;
                const amount = parseFloat(group.Metrics.UnblendedCost.Amount);
                if (amount > 0) {
                    if (!usageTypeData[date][service]) usageTypeData[date][service] = {};
                    usageTypeData[date][service][usageType] = amount;
                }
            });
        });

        // Process region data
        response2.ResultsByTime.forEach(result => {
            const date = result.TimePeriod.Start;
            if (!regionData[date]) regionData[date] = {};
            
            result.Groups.forEach(group => {
                const [service, region] = group.Keys;
                const amount = parseFloat(group.Metrics.UnblendedCost.Amount);
                if (amount > 0) {
                    if (!regionData[date][service]) regionData[date][service] = {};
                    regionData[date][service][region] = amount;
                }
            });
        });

        // Combine the data
        Object.keys(usageTypeData).forEach(date => {
            if (!dailyCosts[date]) dailyCosts[date] = {};
            
            Object.keys(usageTypeData[date]).forEach(service => {
                if (!dailyCosts[date][service]) dailyCosts[date][service] = [];
                
                Object.entries(usageTypeData[date][service]).forEach(([usageType, amount]) => {
                    let region = 'unknown';
                    if (regionData[date] && regionData[date][service]) {
                        const regions = Object.keys(regionData[date][service]);
                        if (regions.length === 1) {
                            region = regions[0];
                        } else {
                            region = regions.reduce((a, b) => 
                                regionData[date][service][a] > regionData[date][service][b] ? a : b
                            );
                        }
                    }
                    
                    dailyCosts[date][service].push({
                        usage_type: usageType,
                        region: region,
                        amount: amount
                    });
                });
            });
        });

        return dailyCosts;
    } catch (error) {
        throw new Error(`Error fetching cost data: ${error.message}`);
    }
}

async function getPerplexityCosts(startDate, endDate) {
    try {
        const tableName = getTableName(SOCIAL_LENS_TABLE);
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);

        let items = [];
        let lastEvaluatedKey = null;

        do {
            const scanParams = {
                TableName: tableName,
                ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
            };

            const response = await dynamodb.send(new ScanCommand(scanParams));
            items = items.concat(response.Items);
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        const dailyPerplexityCosts = {};
        let processedCount = 0;
        let matchedCount = 0;

        items.forEach(item => {
            processedCount++;
            try {
                const timestamp = item.completed_at || item.created_at;
                const mlCostData = item.ml_cost;

                if (!timestamp || !mlCostData) return;

                let mlCostParsed;
                if (typeof mlCostData === 'object') {
                    mlCostParsed = mlCostData;
                } else if (typeof mlCostData === 'string') {
                    mlCostParsed = JSON.parse(mlCostData);
                } else {
                    return;
                }

                const totalCost = mlCostParsed.total_cost || 0;
                if (totalCost === 0) return;

                let itemDateTime;
                if (typeof timestamp === 'string') {
                    if (timestamp.includes('T')) {
                        itemDateTime = new Date(timestamp);
                    } else {
                        itemDateTime = new Date(timestamp);
                    }
                } else if (typeof timestamp === 'number') {
                    itemDateTime = new Date(timestamp * 1000);
                } else {
                    return;
                }

                if (itemDateTime >= startDateTime && itemDateTime < endDateTime) {
                    matchedCount++;
                    const itemDate = itemDateTime.toISOString().split('T')[0];

                    const usageEntry = {
                        usage_type: 'API-Call',
                        region: 'us-east-1',
                        amount: parseFloat(totalCost),
                        requests: parseInt(mlCostParsed.total_requests || 0),
                        prompt_tokens: parseInt(mlCostParsed.total_prompt_tokens || 0),
                        completion_tokens: parseInt(mlCostParsed.total_completion_tokens || 0),
                        total_tokens: parseInt(mlCostParsed.total_tokens || 0),
                        domains_processed: (mlCostParsed.domain_details || []).length
                    };

                    if (mlCostParsed.domain_details) {
                        usageEntry.domain_details = mlCostParsed.domain_details.map(detail => ({
                            domain: detail.domain || 'unknown',
                            model: detail.model || 'sonar',
                            usage: detail.usage || {},
                            cost: detail.cost || {},
                            citations_count: detail.citations_count || 0,
                            search_results_count: detail.search_results_count || 0
                        }));
                    }

                    if (!dailyPerplexityCosts[itemDate]) {
                        dailyPerplexityCosts[itemDate] = {};
                    }
                    if (!dailyPerplexityCosts[itemDate]['Perplexity API']) {
                        dailyPerplexityCosts[itemDate]['Perplexity API'] = [];
                    }
                    dailyPerplexityCosts[itemDate]['Perplexity API'].push(usageEntry);
                }
            } catch (error) {
                // Skip invalid items
            }
        });

        return dailyPerplexityCosts;
    } catch (error) {
        throw new Error(`Error fetching Perplexity cost data: ${error.message}`);
    }
}

function aggregateDailyCostData(claudeDaily, bedrockDaily, perplexityDaily) {
    const allData = {};
    
    // Combine all data sources
    [claudeDaily, bedrockDaily, perplexityDaily].forEach(source => {
        Object.entries(source).forEach(([date, services]) => {
            if (!allData[date]) allData[date] = {};
            Object.assign(allData[date], services);
        });
    });

    const dailyReports = {};
    let overallGrandTotal = 0;

    Object.keys(allData).sort().forEach(date => {
        const services = allData[date];
        const modelTotals = {};
        const modelRegions = {};
        const regionTotals = {};
        const regionModels = {};
        let dailyTotal = 0;

        const perplexityMetrics = {
            api_calls: 0,
            total_requests: 0,
            total_prompt_tokens: 0,
            total_completion_tokens: 0,
            total_tokens: 0,
            total_domains_processed: 0,
            unique_domains: new Set()
        };

        Object.entries(services).forEach(([service, usageList]) => {
            usageList.forEach(usageData => {
                const amount = usageData.amount;
                const region = usageData.region;

                if (service === 'Perplexity API') {
                    perplexityMetrics.api_calls += 1;
                    perplexityMetrics.total_requests += usageData.requests || 0;
                    perplexityMetrics.total_prompt_tokens += usageData.prompt_tokens || 0;
                    perplexityMetrics.total_completion_tokens += usageData.completion_tokens || 0;
                    perplexityMetrics.total_tokens += usageData.total_tokens || 0;
                    perplexityMetrics.total_domains_processed += usageData.domains_processed || 0;

                    if (usageData.domain_details) {
                        usageData.domain_details.forEach(detail => {
                            perplexityMetrics.unique_domains.add(detail.domain || 'unknown');
                        });
                    }
                }

                modelTotals[service] = (modelTotals[service] || 0) + amount;
                if (!modelRegions[service]) modelRegions[service] = {};
                modelRegions[service][region] = (modelRegions[service][region] || 0) + amount;

                regionTotals[region] = (regionTotals[region] || 0) + amount;
                if (!regionModels[region]) regionModels[region] = {};
                regionModels[region][service] = (regionModels[region][service] || 0) + amount;

                dailyTotal += amount;
            });
        });

        const byModel = {};
        Object.entries(modelTotals).forEach(([model, totalCost]) => {
            const percentage = dailyTotal > 0 ? Math.round((totalCost / dailyTotal) * 1000) / 10 : 0;
            const regions = {};
            Object.entries(modelRegions[model] || {}).forEach(([region, cost]) => {
                regions[region] = { cost: Math.round(cost * 10000) / 10000 };
            });

            const modelData = {
                total_cost: Math.round(totalCost * 10000) / 10000,
                percentage: percentage,
                regions: regions
            };

            if (model === 'Perplexity API') {
                Object.assign(modelData, {
                    api_calls: perplexityMetrics.api_calls,
                    total_requests: perplexityMetrics.total_requests,
                    total_prompt_tokens: perplexityMetrics.total_prompt_tokens,
                    total_completion_tokens: perplexityMetrics.total_completion_tokens,
                    total_tokens: perplexityMetrics.total_tokens,
                    total_domains_processed: perplexityMetrics.total_domains_processed,
                    unique_domains_count: perplexityMetrics.unique_domains.size,
                    unique_domains: Array.from(perplexityMetrics.unique_domains)
                });
            }

            byModel[model] = modelData;
        });

        const byRegion = {};
        Object.entries(regionTotals).forEach(([region, totalCost]) => {
            const models = {};
            Object.entries(regionModels[region] || {}).forEach(([model, cost]) => {
                models[model] = { cost: Math.round(cost * 10000) / 10000 };
            });

            byRegion[region] = {
                total_cost: Math.round(totalCost * 10000) / 10000,
                models: models
            };
        });

        dailyReports[date] = {
            model_usage_summary: {
                by_model: byModel,
                by_region: byRegion
            },
            daily_total: Math.round(dailyTotal * 10000) / 10000
        };

        overallGrandTotal += dailyTotal;
    });

    return [dailyReports, overallGrandTotal];
}

export async function getCostReport(body) {
    const requestId = body.requestId;
    delete body.requestId;

    try {
        const { start_date, end_date } = body;

        if (!start_date || !end_date) {
            return {
                statusCode: 400,
                body: {
                    message: 'Missing required parameters',
                    error: 'Both start_date and end_date are required in YYYY-MM-DD format'
                }
            };
        }

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (startDate > endDate) {
            return {
                statusCode: 400,
                body: {
                    message: 'Invalid date range',
                    error: 'start_date must be earlier than or equal to end_date'
                }
            };
        }

        const daysAnalyzed = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        logger.info(FILE_NAME, 'getCostReport', requestId, {
            message: 'Starting cost analysis',
            dateRange: { start_date, end_date, days_analyzed: daysAnalyzed }
        });

        const claudeServices = [
            'Claude Sonnet 4 (Amazon Bedrock Edition)',
            'Claude 3.5 Sonnet (Amazon Bedrock Edition)',
            'Claude 3 Sonnet (Amazon Bedrock Edition)',
            'Claude 3 Haiku (Amazon Bedrock Edition)',
            'Claude 3 Opus (Amazon Bedrock Edition)',
            'Claude 2.1 (Amazon Bedrock Edition)',
            'Claude 2 (Amazon Bedrock Edition)',
            'Claude Instant (Amazon Bedrock Edition)'
        ];
        const bedrockServices = ['Amazon Bedrock'];

        const [claudeDaily, bedrockDaily, perplexityDaily] = await Promise.all([
            getServiceCosts(start_date, end_date, claudeServices),
            getServiceCosts(start_date, end_date, bedrockServices),
            getPerplexityCosts(start_date, end_date)
        ]);

        const [dailyReports, grandTotal] = aggregateDailyCostData(
            claudeDaily,
            bedrockDaily,
            perplexityDaily
        );

        const report = {
            period: {
                start_date: start_date,
                end_date: end_date,
                days_analyzed: daysAnalyzed
            },
            daily_breakdown: dailyReports,
            grand_total: Math.round(grandTotal * 10000) / 10000,
            timestamp: new Date().toISOString(),
            debug_info: {
                perplexity_days_found: Object.keys(perplexityDaily).length,
                total_days_with_data: Object.keys(dailyReports).length
            }
        };

        // Save to DynamoDB
        const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const tableName = getTableName(DYNAMODB_TABLE);
        
        await dynamodb.send(new PutCommand({
            TableName: tableName,
            Item: {
                track_id: trackId,
                report: JSON.stringify(report),
                created_at: new Date().toISOString()
            }
        }));

        logger.info(FILE_NAME, 'getCostReport', requestId, {
            message: 'Cost report generated successfully',
            trackId: trackId,
            grandTotal: grandTotal
        });

        return {
            statusCode: 200,
            body: {
                message: 'Cost report generated successfully',
                track_id: trackId,
                ...report
            }
        };

    } catch (error) {
        logger.error(FILE_NAME, 'getCostReport', requestId, {
            error: error.message,
            errorStack: error.stack
        });

        return {
            statusCode: 500,
            body: {
                message: 'Failed to generate cost report',
                error: error.message
            }
        };
    }
}