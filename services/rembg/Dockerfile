FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Base-image packaging tools carry their own advisories; update them too.
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# Bake the u2net model into the image at build time so the container
# needs no internet access at runtime. Stored outside any home directory
# so the unprivileged runtime user below can read it.
ENV U2NET_HOME=/opt/u2net
RUN python -c "from rembg import new_session; new_session('u2net')"

COPY main.py .

# numba (via rembg -> pymatting) writes a JIT cache next to its packages
# by default, which the unprivileged user can't; point it at /tmp.
ENV NUMBA_CACHE_DIR=/tmp/numba-cache
# pip is only needed to build the image; removing it also drops the
# libraries it vendors (which scanners flag) from the runtime image.
RUN useradd --uid 1001 --no-create-home --shell /usr/sbin/nologin rembg \
    && chmod -R a+rX /opt/u2net \
    && pip uninstall -y pip
USER rembg

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
