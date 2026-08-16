package com.shahboun.aqim;

import android.app.Activity;
import android.os.Bundle;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;
import android.content.Context;
import android.content.res.Configuration;

public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(15, 76, 58));
        getWindow().setNavigationBarColor(Color.rgb(246, 240, 229));
        setContentView(new AqimView(this));
    }

    private static class AqimView extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path arch = new Path();
        private final boolean dark;

        AqimView(Context context) {
            super(context);
            dark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                    == Configuration.UI_MODE_NIGHT_YES;
            setLayoutDirection(LAYOUT_DIRECTION_RTL);
        }

        private void text(Canvas c, String value, float x, float y, float size, int color, boolean bold) {
            paint.reset();
            paint.setAntiAlias(true);
            paint.setColor(color);
            paint.setTextSize(size);
            paint.setTextAlign(Paint.Align.CENTER);
            paint.setTypeface(bold ? android.graphics.Typeface.DEFAULT_BOLD : android.graphics.Typeface.DEFAULT);
            c.drawText(value, x, y, paint);
        }

        @Override
        protected void onDraw(Canvas c) {
            super.onDraw(c);
            float w = getWidth();
            float h = getHeight();
            float cx = w / 2f;
            int bg = dark ? Color.rgb(24, 28, 27) : Color.rgb(246, 240, 229);
            int green = dark ? Color.rgb(28, 96, 73) : Color.rgb(15, 76, 58);
            int gold = Color.rgb(215, 180, 106);
            int text = dark ? Color.rgb(244, 238, 225) : Color.rgb(28, 42, 37);
            int muted = dark ? Color.rgb(190, 194, 189) : Color.rgb(97, 105, 101);
            int card = dark ? Color.rgb(35, 42, 39) : Color.WHITE;

            c.drawColor(bg);
            float topH = Math.min(h * 0.42f, 360f);
            paint.setColor(green);
            c.drawRect(0, 0, w, topH, paint);

            float aw = Math.min(w * 0.50f, 260f);
            float left = cx - aw / 2f;
            float right = cx + aw / 2f;
            float archTop = 38f;
            float archBottom = topH - 28f;
            arch.reset();
            arch.moveTo(left, archBottom);
            arch.lineTo(left, archTop + aw * 0.36f);
            arch.quadTo(cx, archTop - aw * 0.16f, right, archTop + aw * 0.36f);
            arch.lineTo(right, archBottom);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(Math.max(3f, w * 0.008f));
            paint.setColor(gold);
            c.drawPath(arch, paint);
            paint.setStyle(Paint.Style.FILL);

            text(c, "أَقِم", cx, topH * 0.50f, Math.min(w * 0.16f, 72f), Color.rgb(246,240,229), true);
            text(c, "مؤذن ليبيا ومواقيت الصلاة", cx, topH * 0.67f, Math.min(w * 0.052f, 24f), Color.rgb(246,240,229), false);
            text(c, "صلاتك • ذكرك • يومك", cx, topH * 0.80f, Math.min(w * 0.043f, 20f), gold, false);

            float margin = Math.max(20f, w * 0.055f);
            float cardTop = topH + 26f;
            float cardBottom = Math.min(h - 30f, cardTop + Math.max(210f, h * 0.32f));
            RectF r = new RectF(margin, cardTop, w - margin, cardBottom);
            paint.setColor(card);
            c.drawRoundRect(r, 30f, 30f, paint);

            text(c, "الإصدار التأسيسي 1.0.0", cx, cardTop + 58f, Math.min(w * 0.050f, 23f), text, true);
            text(c, "جاهز للتحديثات والإضافات القادمة", cx, cardTop + 100f, Math.min(w * 0.040f, 18f), muted, false);
            paint.setColor(gold);
            c.drawRoundRect(new RectF(cx - 55f, cardTop + 125f, cx + 55f, cardTop + 129f), 2f, 2f, paint);
            text(c, "تصميم وتطوير", cx, cardTop + 166f, Math.min(w * 0.036f, 16f), muted, false);
            text(c, "أحمد شهبون", cx, cardTop + 198f, Math.min(w * 0.046f, 21f), text, true);
            text(c, "0921984045", cx, cardTop + 230f, Math.min(w * 0.040f, 18f), green, true);
        }
    }
}
