import io
import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)

from backend.app.core.config import settings
from backend.app.services.data_service import data_service
from backend.app.services.indicator_service import IndicatorService
from backend.app.services.trend_service import TrendService
from backend.app.services.insights_service import insights_service
from backend.app.services.portfolio_service import portfolio_service
from backend.app.ml.forecasting_service import forecasting_service

class PDFReportService:
    """
    Generates professional, publication-quality institutional PDF research reports
    with key metrics, technical indicators, ML forecast, AI insights, and disclaimers.
    """

    async def generate_stock_report_pdf(self, ticker: str) -> bytes:
        clean_ticker = ticker.strip().upper()
        
        # 1. Gather all analytical data
        info = await data_service.get_ticker_info(clean_ticker)
        df = await data_service.get_history_df(clean_ticker, range_val="1y", interval="1d")
        
        snapshot = IndicatorService.get_summary_snapshot(df) if len(df) >= 20 else {}
        patterns = TrendService.detect_candlestick_patterns(df) if len(df) >= 10 else []
        trend_class = TrendService.classify_trend(df, snapshot) if snapshot else {}
        signal = TrendService.calculate_signal_score(df, snapshot, patterns) if snapshot else {}
        
        # Risk metrics
        risk = portfolio_service.calculate_risk_metrics(df) if len(df) >= 20 else {}
        
        # ML Forecast (7-day Random Forest default)
        forecast_data = {}
        try:
            forecast_data = await forecasting_service.predict(clean_ticker, model_name="random_forest", horizon_days=7)
        except Exception:
            try:
                forecast_data = await forecasting_service.predict(clean_ticker, model_name="arima", horizon_days=7)
            except Exception:
                pass
        
        # Grounded insights
        insights = {}
        try:
            insights = await insights_service.generate_insights(clean_ticker)
        except Exception:
            pass

        # 2. Build PDF Document
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0F172A')
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#64748B')
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=8,
            spaceAfter=4
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'DisclaimerText',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#9A3412')
        )
        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1E293B')
        )
        table_cell_bold = ParagraphStyle(
            'TableCellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0F172A')
        )

        elements = []

        # Header: Logo & Title
        header_table = Table([
            [
                Paragraph(f"<b>MarketLens AI</b> &bull; Stock Research &amp; Intelligence Report", subtitle_style),
                Paragraph(f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC", subtitle_style)
            ],
            [
                Paragraph(f"{clean_ticker} &mdash; {info.get('name', clean_ticker)}", title_style),
                Paragraph(f"Exchange: <b>{info.get('exchange', 'EQUITY')}</b> | Sector: <b>{info.get('sector', 'N/A')}</b>", subtitle_style)
            ]
        ], colWidths=[380, 160])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,-1), 'RIGHT'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 8))

        # Mandatory Educational Disclaimer Box
        disclaimer_text = f"EDUCATIONAL ANALYTICAL REPORT ONLY &bull; NOT FINANCIAL ADVICE<br/>" \
                          f"This document is generated by MarketLens AI algorithms strictly for analytical, quantitative, " \
                          f"and research purposes. It does not constitute investment advice, an endorsement, or a solicitation " \
                          f"to purchase or sell securities. Past performance and algorithmic forecasts do not guarantee future returns."
        disc_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[540])
        disc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFEDD5')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#F97316')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(disc_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section 1: Executive Price & Quantitative Risk Summary
        # -------------------------------------------------------------
        elements.append(Paragraph("1. Executive Price & Quantitative Risk Profile", h2_style))
        curr_price = info.get("current_price", snapshot.get("close", 0.0))
        change_pct = info.get("change_percent", 0.0)
        
        stat_data = [
            [
                Paragraph("<b>Current Price:</b>", table_cell_style),
                Paragraph(f"${curr_price:.2f} ({'+' if change_pct >= 0 else ''}{change_pct:.2f}%)", table_cell_bold),
                Paragraph("<b>52-Week Range:</b>", table_cell_style),
                Paragraph(f"${info.get('fifty_two_week_low', 0):.2f} - ${info.get('fifty_two_week_high', 0):.2f}", table_cell_bold),
            ],
            [
                Paragraph("<b>Market Cap:</b>", table_cell_style),
                Paragraph(f"${(info.get('market_cap', 0) / 1e9):.2f}B" if info.get('market_cap') else "N/A", table_cell_bold),
                Paragraph("<b>Avg Volume (30D):</b>", table_cell_style),
                Paragraph(f"{info.get('average_volume', 0):,}", table_cell_bold),
            ],
            [
                Paragraph("<b>Annualized Volatility:</b>", table_cell_style),
                Paragraph(f"{risk.get('annualized_volatility_pct', snapshot.get('annualized_volatility_pct', 0)):.1f}%", table_cell_bold),
                Paragraph("<b>Sharpe Ratio (Rf=4.5%):</b>", table_cell_style),
                Paragraph(f"{risk.get('sharpe_ratio', 0.0):.2f}", table_cell_bold),
            ],
            [
                Paragraph("<b>Maximum Drawdown:</b>", table_cell_style),
                Paragraph(f"{risk.get('max_drawdown_pct', 0):.1f}%", table_cell_bold),
                Paragraph("<b>Historical 1D 95% VaR:</b>", table_cell_style),
                Paragraph(f"{risk.get('var_95_daily_pct', 0):.2f}%", table_cell_bold),
            ]
        ]
        
        stat_table = Table(stat_data, colWidths=[130, 140, 130, 140])
        stat_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        elements.append(stat_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section 2: Technical Trend Classification & Transparent Signal Score
        # -------------------------------------------------------------
        elements.append(Paragraph("2. Technical Trend & Signal Score Architecture", h2_style))
        sig_score = signal.get("score", 0.0)
        sig_cat = signal.get("category", "Neutral")
        
        trend_summary = f"<b>Primary Trend:</b> {trend_class.get('primary_trend', 'N/A')} ({trend_class.get('trend_strength', 'N/A')}) &bull; " \
                        f"<b>ADX (14):</b> {snapshot.get('adx', 0):.1f} &bull; " \
                        f"<b>30D Regression Slope:</b> {snapshot.get('linear_regression_slope_pct', 0):+.2f}% &bull; " \
                        f"<b>RSI (14):</b> {snapshot.get('rsi_14', 50):.1f}"
        elements.append(Paragraph(trend_summary, body_style))
        elements.append(Spacer(1, 4))

        # Signal score components table
        sig_rows = [
            [
                Paragraph("<b>Component Factor</b>", table_cell_bold),
                Paragraph("<b>Weight</b>", table_cell_bold),
                Paragraph("<b>Score</b>", table_cell_bold),
                Paragraph("<b>Analytical Reason</b>", table_cell_bold)
            ]
        ]
        for c in signal.get("components", []):
            sig_rows.append([
                Paragraph(c.get("name", ""), table_cell_style),
                Paragraph(f"{c.get('weight', 0)}%", table_cell_style),
                Paragraph(f"{c.get('score', 0):+.1f}", table_cell_bold),
                Paragraph(c.get("reason", ""), table_cell_style),
            ])
        
        # Total row
        sig_rows.append([
            Paragraph("<b>COMPOSITE SIGNAL SCORE</b>", table_cell_bold),
            Paragraph("<b>100%</b>", table_cell_bold),
            Paragraph(f"<b>{sig_score:+.1f}</b>", table_cell_bold),
            Paragraph(f"<b>Verdict: {sig_cat}</b> (Scale: -100 to +100)", table_cell_bold),
        ])

        sig_table = Table(sig_rows, colWidths=[130, 45, 50, 315])
        sig_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F1F5F9')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        elements.append(sig_table)
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section 3: Machine Learning Forecast & Time-Series Validation
        # -------------------------------------------------------------
        elements.append(Paragraph("3. Machine Learning Time-Series Forecast & Validation", h2_style))
        if forecast_data:
            f_metrics = forecast_data.get("metrics", {})
            f_points = forecast_data.get("forecast_points", [])
            
            perf_text = f"<b>Model:</b> {forecast_data.get('model_name', 'Random Forest')} &bull; " \
                        f"<b>Reliability:</b> {f_metrics.get('reliability_rating', 'Moderate')} &bull; " \
                        f"<b>Directional Accuracy:</b> {f_metrics.get('directional_accuracy_pct', 0):.1f}% &bull; " \
                        f"<b>Beats Baseline:</b> {'YES' if f_metrics.get('beats_baseline') else 'NO (Underperforming Naive Baseline)'}"
            elements.append(Paragraph(perf_text, body_style))
            elements.append(Spacer(1, 4))

            # Forecast trajectory table
            f_rows = [
                [
                    Paragraph("<b>Horizon</b>", table_cell_bold),
                    Paragraph("<b>Target Date</b>", table_cell_bold),
                    Paragraph("<b>Forecast Price</b>", table_cell_bold),
                    Paragraph("<b>Expected Return</b>", table_cell_bold),
                    Paragraph("<b>80% Confidence Range</b>", table_cell_bold),
                    Paragraph("<b>95% Confidence Range</b>", table_cell_bold)
                ]
            ]
            for pt in f_points[:7]:  # show up to 7 bars
                fc_price = pt.get("predicted_price", curr_price)
                exp_ret = ((fc_price / curr_price) - 1.0) * 100.0 if curr_price > 0 else 0.0
                f_rows.append([
                    Paragraph(f"Day {pt.get('horizon_day', len(f_rows))}", table_cell_style),
                    Paragraph(pt.get("date", ""), table_cell_style),
                    Paragraph(f"${fc_price:.2f}", table_cell_bold),
                    Paragraph(f"{exp_ret:+.2f}%", table_cell_style),
                    Paragraph(f"${pt.get('lower_80', 0):.2f} - ${pt.get('upper_80', 0):.2f}", table_cell_style),
                    Paragraph(f"${pt.get('lower_95', 0):.2f} - ${pt.get('upper_95', 0):.2f}", table_cell_style),
                ])

            fc_table = Table(f_rows, colWidths=[55, 75, 75, 75, 130, 130])
            fc_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ]))
            elements.append(fc_table)
        else:
            elements.append(Paragraph("Machine learning forecast temporarily unavailable for this symbol.", body_style))
        elements.append(Spacer(1, 10))

        # -------------------------------------------------------------
        # Section 4: Grounded AI Insights & Market Sentiment
        # -------------------------------------------------------------
        elements.append(Paragraph("4. Grounded Market Intelligence & Catalysts", h2_style))
        if insights:
            exec_summary = insights.get("executive_summary", "")
            bullish_factors = insights.get("bullish_factors", [])
            bearish_factors = insights.get("bearish_factors", [])

            elements.append(Paragraph(f"<b>Executive Summary:</b> {exec_summary}", body_style))
            elements.append(Spacer(1, 4))

            # Catalysts & Risks side-by-side or stacked
            bull_text = "<b>Bullish Catalysts:</b><br/>" + "<br/>".join([f"&bull; {b}" for b in bullish_factors[:3]])
            bear_text = "<b>Key Risk Factors:</b><br/>" + "<br/>".join([f"&bull; {r}" for r in bearish_factors[:3]])

            insight_table = Table([
                [
                    Paragraph(bull_text, body_style),
                    Paragraph(bear_text, body_style)
                ]
            ], colWidths=[265, 275])
            insight_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (0,0), colors.HexColor('#F0FDF4')),
                ('BACKGROUND', (1,0), (1,0), colors.HexColor('#FEF2F2')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ]))
            elements.append(insight_table)
        elements.append(Spacer(1, 14))

        # Footer divider and final disclaimer
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=6))
        elements.append(Paragraph(
            "<b>MarketLens AI Methodological Notice:</b> All calculations rely on historical end-of-day price data and strictly backward-looking mathematical indicators. "
            "Predictive intervals are derived from empirical time-series error residuals and must not be interpreted as deterministic guarantees. "
            "MarketLens AI assumes zero liability for investment decisions made based on this document.",
            ParagraphStyle('FooterNotice', parent=styles['Normal'], fontName='Helvetica', fontSize=6.5, leading=8.5, textColor=colors.HexColor('#64748B'))
        ))

        # Build document
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

pdf_report_service = PDFReportService()
