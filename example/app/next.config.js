/** @type {import('next').NextConfig} */
const withPreact = require('next-plugin-preact');
const withBundleAnalyzer = require('@next/bundle-analyzer');

const config = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(withPreact(
  {
    reactStrictMode: true,
    swcMinify: true,
  }));

module.exports = config;
