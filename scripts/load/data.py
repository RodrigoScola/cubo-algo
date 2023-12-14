import pandas as pd
import glob as glob
import os
import json

import pip

def import_or_install(package):
    try:
         return __import__(package)
    except ImportError:
     return None


import_or_install('pandas')
import_or_install('json')


f = open('../../data/endpoints.json')

data = json.load(f)

names = [
key['name'] for key in data
]


if not os.path.exists('./results/data'):
    os.makedirs('./results/data')


directories = glob.glob('./results/*')

df_headers= ['timestamp', 'requests_per_second', 'time_per_request', 'method']

for name in names:
        csvs = []
        for directory in directories:
            files = glob.glob(directory + '/' + name + '/*.csv')

            result =pd.DataFrame(columns=df_headers)
            if (len(files) > 0):
                for file in files:
                    df = pd.DataFrame(pd.read_csv(file, delimiter='\t'))

                    timestamp =df.iloc[[-1]]['starttime'].values[0]

                    seconds_grouped = df.groupby('seconds').count()
                    numSecods = len(seconds_grouped)
                    seconds_grouped = df.groupby('seconds').count()


                     # time per request
                    sum_seconds = df['wait'].sum()
                    newDf =  pd.DataFrame([[timestamp,len(df.index) / len(seconds_grouped.index),     sum_seconds / len(df.index),          "get"  ]], columns=df_headers)
                    result = pd.concat([result, newDf])

            filename= f'./results/data/{name}.csv'
            if len(result.index) > 0:
                # :: Combines all the results and averages them out
                resultAVgDf = pd.DataFrame(
                    [[timestamp,result['requests_per_second'].mean(), result['time_per_request'].mean(),"get"]],
                    columns=['timestamp','requests_per_second', 'time_per_request',"method"])
                if (os.path.isfile(filename)):
                    resultAVgDf.to_csv(filename, mode='a', header=False, index=False)
                else:
                    resultAVgDf.to_csv(filename, mode='a', header=df_headers, index=False)
